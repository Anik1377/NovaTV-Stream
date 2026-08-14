'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Loader2, ChevronLeft, Subtitles, AlertTriangle,
  MonitorPlay, ChevronDown, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsIOS } from '@/hooks/use-ios';
import { useIsMobile } from '@/hooks/use-mobile';
import type { StreamSource, Caption } from '@/lib/moviebox';
import Hls from 'hls.js';

interface DirectPlayerProps {
  title?: string;
  subjectId: string;
  detailPath: string;
  se?: number;
  ep?: number;
  onClose: () => void;
}

export function DirectPlayer({
  title,
  subjectId,
  detailPath,
  se = 1,
  ep = 1,
  onClose,
}: DirectPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [sources, setSources] = useState<StreamSource[]>([]);
  const [selectedQuality, setSelectedQuality] = useState(0);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [selectedCaption, setSelectedCaption] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const isIOS = useIsIOS();
  const isMobile = useIsMobile();

  // ── Fetch stream sources ──
  const fetchStream = useCallback(async (signal: AbortSignal) => {
    if (signal.aborted) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/moviebox/stream?id=${subjectId}&slug=${encodeURIComponent(detailPath)}&se=${se}&ep=${ep}`,
      );
      const data = await res.json();
      if (signal.aborted) return;

      if (!data.has_resource || (!data.sources?.length && !data.hls?.length)) {
        setError(data.note || 'No stream available for this content.');
        setLoading(false);
        return;
      }

      // Prefer MP4 sources, fallback to HLS
      const mp4Sources = (data.sources || []).filter((s: StreamSource) => s.format === 'MP4');
      const hlsSources = data.hls || [];

      if (mp4Sources.length) {
        mp4Sources.sort((a: StreamSource, b: StreamSource) => {
          const ra = parseInt(a.resolution) || 0;
          const rb = parseInt(b.resolution) || 0;
          return rb - ra;
        });
        setSources(mp4Sources);
      } else if (hlsSources.length) {
        const hlsMapped: StreamSource[] = hlsSources.map((h: any) => ({
          resolution: h.label || h.resolutions || 'Auto',
          format: 'HLS',
          url: h.url,
        }));
        setSources(hlsMapped);
      }

      // Fetch captions
      try {
        const capRes = await fetch(
          `/api/moviebox/captions?id=${subjectId}&slug=${encodeURIComponent(detailPath)}&se=${se}&ep=${ep}`,
        );
        const capData = await capRes.json();
        if (capData.captions?.length && !signal.aborted) {
          setCaptions(capData.captions);
        }
      } catch {
        /* captions optional */
      }

      setLoading(false);
    } catch {
      if (!signal.aborted) {
        setError('Failed to connect to stream server.');
        setLoading(false);
      }
    }
  }, [subjectId, detailPath, se, ep]);

  useEffect(() => {
    const ac = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStream(ac.signal);
    return () => ac.abort();
  }, [fetchStream]);

  // ── Load video source ──
  useEffect(() => {
    if (!sources.length || !videoRef.current) return;

    const video = videoRef.current;
    const src = sources[selectedQuality];
    if (!src?.url) return;

    // Cleanup previous
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (src.format === 'HLS' || src.url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hls.loadSource(src.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError('Fatal stream error. Try a different quality.');
                hls.destroy();
                break;
            }
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // iOS native HLS
        video.src = src.url;
        video.play().catch(() => {});
      }
    } else {
      // Direct MP4
      video.src = src.url;
      video.play().catch(() => {});
    }
  }, [sources, selectedQuality]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  // ── Body scroll lock ──
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.classList.add('player-open');
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.classList.remove('player-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // ── Video event handlers ──
  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);
  const onTimeUpdate = () => {
    setCurrentTime(videoRef.current?.currentTime || 0);
    const buf = videoRef.current?.buffered;
    if (buf && buf.length > 0) setBuffered(buf.end(buf.length - 1));
  };
  const onDurationChange = () => setDuration(videoRef.current?.duration || 0);
  const onLoadedData = () => setLoading(false);
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (videoRef.current && duration) videoRef.current.currentTime = pct * duration;
  };

  // ── Auto-hide controls (timer-based, triggered by playing state) ──
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (playing) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [playing]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
 if (e.key === 'Escape') onClose();
      if (e.key === ' ' && !showSettings) { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight' && videoRef.current) videoRef.current.currentTime += 10;
      if (e.key === 'ArrowLeft' && videoRef.current) videoRef.current.currentTime -= 10;
      if (e.key === 'ArrowUp' && videoRef.current) videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
      if (e.key === 'ArrowDown' && videoRef.current) videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, showSettings]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleQualityChange = (idx: number) => {
    setSelectedQuality(idx);
    setShowSettings(false);
    setLoading(true);
  };

  const handleCaptionToggle = (idx: number) => {
    const video = videoRef.current;
    if (!video) return;
    // Remove old tracks
    while (video.textTracks.length) video.removeTextTrack(video.textTracks[0]);

    if (idx === selectedCaption) {
      setSelectedCaption(-1);
      return;
    }

    const cap = captions[idx];
    if (!cap?.url) return;

    const track = video.addTextTrack('subtitles', cap.label || cap.language, cap.language);
    track.mode = 'showing';

    // Fetch and parse VTT/SRT
    fetch(cap.url)
      .then((r) => r.text())
      .then((text) => {
        const cues = parseSubtitles(text, cap.url.endsWith('.srt') ? 'srt' : 'vtt');
        cues.forEach((c) => {
          const ct = new VTTCue(c.start, c.end, c.text);
          track.addCue(ct);
        });
      })
      .catch(() => {});

    setSelectedCaption(idx);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
        onClick={() => { setShowControls(true); if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); if (playing) controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000); }}
      >
        {/* Safe area spacer for iOS */}
        {isIOS && (
          <div className="shrink-0" style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        )}

        {/* Top bar */}
        <motion.div
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-3 pb-6"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
            paddingTop: isIOS ? 'max(12px, env(safe-area-inset-top, 0px))' : 12,
          }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white/90 text-sm font-semibold transition-colors active:scale-95"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            <span>{isIOS ? 'Done' : 'Back'}</span>
          </button>
          <h3 className="text-white/90 font-medium text-sm truncate max-w-[50%] text-center">
            {title || 'Now Playing'}
          </h3>
          <div className="w-16" /> {/* spacer */}
        </motion.div>

        {/* Video container */}
        <div
          ref={containerRef}
          className="relative flex-1 bg-black flex items-center justify-center cursor-pointer"
          onDoubleClick={() => {
            if (containerRef.current) {
              if (document.fullscreenElement) document.exitFullscreen();
              else containerRef.current.requestFullscreen?.();
            }
          }}
          onClick={togglePlay}
        >
          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80 gap-3">
              <Loader2 className="w-12 h-12 animate-spin text-[#00f2ff]" />
              <p className="text-white/40 text-sm">Loading stream...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black gap-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <p className="text-white/60 text-sm text-center max-w-xs">{error}</p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            autoPlay
            onPlay={onPlay}
            onPause={onPause}
            onTimeUpdate={onTimeUpdate}
            onDurationChange={onDurationChange}
            onLoadedData={onLoadedData}
            onError={() => {
              if (!error) setError('Playback error. Try another quality.');
            }}
            crossOrigin="anonymous"
          />
        </div>

        {/* Bottom controls */}
        <motion.div
          animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 10 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-3"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
            paddingBottom: isIOS ? 'max(12px, env(safe-area-inset-bottom, 0px))' : 12,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer group relative"
            onClick={seek}
          >
            {/* Buffered */}
            {duration > 0 && (
              <div
                className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                style={{ width: `${(buffered / duration) * 100}%` }}
              />
            )}
            {/* Progress */}
            {duration > 0 && (
              <div
                className="absolute top-0 left-0 h-full bg-[#00f2ff] rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            )}
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#00f2ff] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 6px)` : 0 }}
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Left: Play + time */}
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
                {playing ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <span className="text-white/70 text-xs font-mono tabular-nums">
                {fmtTime(currentTime)} / {fmtTime(duration)}
              </span>
            </div>

            {/* Right: Quality + Subtitles */}
            <div className="flex items-center gap-2">
              {/* Quality selector */}
              {sources.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => { setShowSettings(!showSettings); setShowCaptions(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-medium transition-colors"
                  >
                    <MonitorPlay className="w-3.5 h-3.5" />
                    <span>{sources[selectedQuality]?.resolution || 'Auto'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-20"
                        >
                          <div className="px-3 py-2 border-b border-white/10">
                            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Quality</p>
                          </div>
                          <div className="py-1 max-h-52 overflow-y-auto content-scroll">
                            {sources.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => handleQualityChange(i)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                                  i === selectedQuality ? 'bg-[#00f2ff]/10 text-[#00f2ff]' : 'text-white/70 hover:bg-white/5'
                                }`}
                              >
                                <span className="font-medium">{s.resolution}</span>
                                {i === selectedQuality && <Zap className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Subtitle selector */}
              {captions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => { setShowCaptions(!showCaptions); setShowSettings(false); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedCaption >= 0 ? 'bg-[#00f2ff]/15 text-[#00f2ff]' : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }`}
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    <span>CC</span>
                  </button>
                  <AnimatePresence>
                    {showCaptions && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowCaptions(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 w-48 rounded-xl bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-20"
                        >
                          <div className="px-3 py-2 border-b border-white/10">
                            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Subtitles</p>
                          </div>
                          <div className="py-1">
                            <button
                              onClick={() => handleCaptionToggle(-1)}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                selectedCaption === -1 ? 'bg-[#00f2ff]/10 text-[#00f2ff]' : 'text-white/70 hover:bg-white/5'
                              }`}
                            >
                              Off
                            </button>
                            {captions.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => handleCaptionToggle(i)}
                                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                  i === selectedCaption ? 'bg-[#00f2ff]/10 text-[#00f2ff]' : 'text-white/70 hover:bg-white/5'
                                }`}
                              >
                                {c.label || c.language}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── SRT/VTT parser ── */
interface SubCue { start: number; end: number; text: string }

function parseSubtitles(raw: string, format: 'srt' | 'vtt'): SubCue[] {
  const cues: SubCue[] = [];
  const blocks = raw.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    let timeLineIdx = 0;

    // SRT: first line is index number
    if (format === 'srt' && /^\d+$/.test(lines[0]?.trim())) {
      timeLineIdx = 1;
    }

    // VTT header
    if (lines[0]?.includes('WEBVTT')) continue;

    const timeLine = lines[timeLineIdx];
    if (!timeLine?.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);
    const text = lines.slice(timeLineIdx + 1).join('\n').replace(/<[^>]+>/g, '').trim();

    if (text && !isNaN(start) && !isNaN(end)) {
      cues.push({ start, end, text });
    }
  }

  return cues;
}

function parseTimestamp(ts: string): number {
  // Handle both 00:00:00,000 and 00:00:00.000
  const parts = ts.replace(',', '.').split(':');
  if (parts.length === 3) {
    return (
      parseInt(parts[0]) * 3600 +
      parseInt(parts[1]) * 60 +
      parseFloat(parts[2])
    );
  }
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return 0;
}

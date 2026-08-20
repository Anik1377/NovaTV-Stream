'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Maximize2, Minimize2, Loader2, ChevronDown,
  Zap, Crown, RefreshCw, ArrowLeft, List, Play, Tv, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { providers, getProvider, getEmbedUrl } from '@/lib/providers';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { recordWatchHistory } from '@/lib/watch-history';
import { getImageUrl } from '@/lib/tmdb';
import type { Episode } from '@/lib/types';

interface VideoPlayerProps {
  src: string;
  title?: string;
  onClose: () => void;
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  season?: number;
  episode?: number;
}

/* ── iOS native fullscreen detection ── */
function useIOSFullscreenDetect(onReturn: () => void) {
  useEffect(() => {
    const handleEnd = () => onReturn();
    document.addEventListener('webkitendfullscreen', handleEnd);
    return () => document.removeEventListener('webkitendfullscreen', handleEnd);
  }, [onReturn]);
}

export function VideoPlayer({ src, title, onClose, mediaType, tmdbId, season, episode }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showServers, setShowServers] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [activeSeason, setActiveSeason] = useState(season || 1);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const serversRef = useRef<HTMLDivElement>(null);
  const { selectedProvider, setSelectedProvider, selectedMovie, selectedTv } = useAppStore();
  const user = useAuthStore(s => s.user);
  const isMobile = useIsMobile();

  const activeProvider = getProvider(selectedProvider);

  // ── Auto-dismiss loading (onLoad may never fire for cross-origin iframes) ──
  useEffect(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setLoading(false), isMobile ? 5000 : 10000);
    return () => { if (loadTimerRef.current) clearTimeout(loadTimerRef.current); };
  }, [currentSrc, isMobile]);

  // ── Fetch episodes for TV shows ──
  const fetchEpisodes = useCallback(async (tmdbId: number, seasonNum: number) => {
    setEpisodesLoading(true);
    try {
      const res = await fetch(`/api/tmdb/tv/${tmdbId}/season/${seasonNum}`);
      const data = await res.json();
      setEpisodes(data.episodes || []);
    } catch {
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }
  }, []);

  // Fetch episodes when episode panel opens
  useEffect(() => {
    if (showEpisodes && mediaType === 'tv') {
      fetchEpisodes(tmdbId, activeSeason);
    }
  }, [showEpisodes, mediaType, tmdbId, activeSeason, fetchEpisodes]);

  // ── Record watch history ──
  useEffect(() => {
    if (!title) return;
    const item = mediaType === 'tv' ? selectedTv : selectedMovie;
    recordWatchHistory({
      tmdbId, title,
      posterPath: item?.poster_path || null,
      backdropPath: item?.backdrop_path || null,
      mediaType,
      season: season ?? null,
      episode: episode ?? null,
    });
    if (user) {
      fetch('/api/profile/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId, title,
          posterPath: item?.poster_path || null,
          mediaType,
          season: season ?? null,
          episode: episode ?? null,
        }),
      }).catch(() => {});
    }
  }, [tmdbId, mediaType, season, episode, title, user, selectedMovie, selectedTv]);

  // ── Body scroll lock ──
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.setProperty('--player-scroll-y', `${scrollY}px`);
    document.body.classList.add('player-open');
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.classList.remove('player-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // ── iOS fullscreen detection ──
  useIOSFullscreenDetect(onClose);

  // ── Close server dropdown on outside click ──
  useEffect(() => {
    if (!showServers) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (serversRef.current && !serversRef.current.contains(e.target as Node)) {
        setShowServers(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showServers]);

  const switchProvider = (providerId: string) => {
    setSelectedProvider(providerId);
    const newSrc = getEmbedUrl(providerId, mediaType, tmdbId, season, episode);
    setCurrentSrc(newSrc);
    setLoading(true);
    setError(false);
    setShowServers(false);
  };

  const playEpisode = (ep: Episode) => {
    const newSrc = getEmbedUrl(selectedProvider, 'tv', tmdbId, activeSeason, ep.episode_number);
    setCurrentSrc(newSrc);
    setLoading(true);
    setError(false);
    // Update the parent by changing the episode in the store
    useAppStore.getState().setSelectedEpisode(ep);
  };

  const switchSeason = (seasonNum: number) => {
    setActiveSeason(seasonNum);
    fetchEpisodes(tmdbId, seasonNum);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Silently fail on iOS
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showServers && !showEpisodes) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, showServers, showEpisodes]);

  const currentEp = episodes.find(e => e.episode_number === episode);
  const epLabel = mediaType === 'tv' && season && episode
    ? `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
    : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col"
      >
        {/* ── HEADER BAR ── */}
        <div className="flex items-center justify-between px-3 md:px-5 h-12 shrink-0 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-md">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>

          <h3 className="text-white/80 font-medium text-sm truncate max-w-[50%] text-center">
            {title || 'Now Playing'}
          </h3>

          <div className="flex items-center gap-1">
            {/* TV: Episode list toggle */}
            {mediaType === 'tv' && (
              <button
                onClick={() => { setShowEpisodes(!showEpisodes); setShowServers(false); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showEpisodes ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.08]'}`}
                aria-label="Episode list"
              >
                <List className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT (video + panels) ── */}
        <div className="flex-1 flex min-h-0">
          {/* ── VIDEO + BOTTOM CONTROLS ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* ── IFRAME AREA (on top, no overlays) ── */}
            <div
              ref={containerRef}
              className="relative flex-1 min-h-0 bg-black"
            >
              {/* Loading indicator - positioned outside iframe flow, behind it */}
              {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: activeProvider.color }} />
                    <p className="text-white/40 text-xs">Connecting to {activeProvider.name}...</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-[2] bg-[#0a0a0a]">
                  <RefreshCw className="w-10 h-10 text-white/20" />
                  <p className="text-white/40 text-sm">Unable to load from {activeProvider.name}</p>
                  <p className="text-white/25 text-xs">Try switching to a different source below.</p>
                  <button
                    onClick={() => {
                      setError(false);
                      setLoading(true);
                      const retrySrc = currentSrc.includes('?')
                        ? currentSrc + '&_r=' + Date.now()
                        : currentSrc + '?_r=' + Date.now();
                      setCurrentSrc(retrySrc);
                    }}
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* IFRAME — highest z-index, no overlays on top */}
              <iframe
                ref={iframeRef}
                key={currentSrc}
                src={currentSrc}
                className="absolute inset-0 w-full h-full z-[5]"
                referrerPolicy="no-referrer"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                playsInline
                onLoad={() => {
                  setLoading(false);
                  if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
                }}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
                title={title || 'Video Player'}
              />
            </div>

            {/* ── CONTROLS BAR ── */}
            <div className="shrink-0 border-t border-white/[0.06] bg-[#111]/90 backdrop-blur-md">
              {/* Server selector row */}
              <div className="flex items-center gap-2 px-3 md:px-4 py-2.5">
                {/* Server selector dropdown */}
                <div className="relative" ref={serversRef}>
                  <button
                    onClick={() => { setShowServers(!showServers); setShowEpisodes(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-white/70 hover:text-white/90 text-xs font-medium transition-all duration-200"
                  >
                    <Zap className="w-3.5 h-3.5" style={{ color: activeProvider.color }} />
                    <span className="hidden sm:inline">{activeProvider.name}</span>
                    {activeProvider.primary && <Crown className="w-3 h-3 text-amber-400" />}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showServers ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Server dropdown */}
                  <AnimatePresence>
                    {showServers && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-60 rounded-xl bg-[#1a1a1a] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden z-30"
                      >
                        <div className="px-3 py-2 border-b border-white/[0.06]">
                          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">
                            Switch Server
                          </p>
                        </div>
                        <div className="py-1 max-h-72 overflow-y-auto content-scroll">
                          {providers.map((p) => {
                            const isActive = p.id === selectedProvider;
                            return (
                              <button
                                key={p.id}
                                onClick={() => switchProvider(p.id)}
                                className={
                                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ' +
                                  (isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]')
                                }
                              >
                                <div
                                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{ backgroundColor: p.color + '20', color: p.color }}
                                >
                                  {p.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-white/90 text-xs font-medium">{p.name}</p>
                                    {p.primary && <Crown className="w-3 h-3 text-amber-400" />}
                                  </div>
                                  <p className="text-white/40 text-[10px] truncate">{p.description}</p>
                                </div>
                                {isActive && (
                                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Status text */}
                <div className="flex-1 flex items-center justify-center">
                  {loading && !error && (
                    <div className="flex items-center gap-1.5 text-white/40">
                      <Loader2 className="w-3 h-3 animate-spin" style={{ color: activeProvider.color }} />
                      <span className="text-xs">Loading from {activeProvider.name}...</span>
                    </div>
                  )}
                  {error && (
                    <span className="text-xs text-red-400/80">Failed to load — switch server or retry</span>
                  )}
                  {!loading && !error && (
                    <div className="flex items-center gap-2">
                      {epLabel && (
                        <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white/50 text-[11px] font-mono">
                          {epLabel}
                        </span>
                      )}
                      <span className="text-white/30 text-[11px]">
                        Playing on {activeProvider.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Retry button (only on error) */}
                {error && (
                  <button
                    onClick={() => {
                      setError(false);
                      setLoading(true);
                      const retrySrc = currentSrc.includes('?')
                        ? currentSrc + '&_r=' + Date.now()
                        : currentSrc + '?_r=' + Date.now();
                      setCurrentSrc(retrySrc);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span className="hidden sm:inline">Retry</span>
                  </button>
                )}
              </div>

              {/* Video info row */}
              <div className="px-3 md:px-4 pb-2.5">
                <p className="text-white/70 text-sm font-medium truncate">
                  {title || 'Now Playing'}
                </p>
                {currentEp && (
                  <p className="text-white/35 text-xs truncate mt-0.5">{currentEp.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── EPISODE SIDEBAR (TV only, collapsible) ── */}
          <AnimatePresence>
            {showEpisodes && mediaType === 'tv' && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="shrink-0 border-l border-white/[0.06] bg-[#0f0f0f] overflow-hidden"
              >
                <div className="w-80 h-full flex flex-col">
                  {/* Sidebar header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
                    <h4 className="text-white/80 text-sm font-semibold">Episodes</h4>
                    <button
                      onClick={() => setShowEpisodes(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
                      aria-label="Close episodes"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Season tabs */}
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.04] shrink-0 overflow-x-auto no-scrollbar">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((s) => (
                      <button
                        key={s}
                        onClick={() => switchSeason(s)}
                        className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          activeSeason === s
                            ? 'bg-white/10 text-white'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                        }`}
                      >
                        S{s}
                      </button>
                    ))}
                  </div>

                  {/* Episode list */}
                  <div className="flex-1 overflow-y-auto content-scroll">
                    {episodesLoading ? (
                      <div className="p-3 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-16 bg-white/[0.03] rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : episodes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-white/30">
                        <Tv className="w-8 h-8 mb-2" />
                        <p className="text-xs">No episodes found</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {episodes.map((ep) => {
                          const isCurrent = ep.episode_number === episode;
                          return (
                            <button
                              key={ep.id}
                              onClick={() => playEpisode(ep)}
                              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors group ${
                                isCurrent
                                  ? 'bg-white/[0.08] border border-white/[0.06]'
                                  : 'hover:bg-white/[0.04] border border-transparent'
                              }`}
                            >
                              {/* Thumbnail */}
                              <div className="relative w-24 aspect-video rounded-md overflow-hidden bg-white/[0.04] shrink-0">
                                {ep.still_path ? (
                                  <img
                                    src={getImageUrl(ep.still_path, 'w300')}
                                    alt={ep.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Play className="w-5 h-5 text-white/15" />
                                  </div>
                                )}
                                {isCurrent && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-7 h-7 rounded-full bg-red-600/90 flex items-center justify-center">
                                      <div className="w-2 h-2.5 border-l-[3px] border-r-[3px] border-white ml-0.5" />
                                    </div>
                                  </div>
                                )}
                                {!isCurrent && (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <Play className="w-5 h-5 text-white fill-white" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-white/40 text-[10px] font-mono">
                                    E{String(ep.episode_number).padStart(2, '0')}
                                  </span>
                                  {ep.runtime && (
                                    <span className="text-white/25 text-[10px]">{ep.runtime}m</span>
                                  )}
                                </div>
                                <p className={`text-xs font-medium truncate ${isCurrent ? 'text-white' : 'text-white/70'}`}>
                                  {ep.name}
                                </p>
                                <p className="text-white/30 text-[10px] truncate mt-0.5 line-clamp-1">
                                  {ep.overview || 'No description'}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
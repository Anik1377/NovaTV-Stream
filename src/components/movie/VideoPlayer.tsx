'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Maximize2, Minimize2, Loader2, Play, ChevronDown, Zap, Crown, ChevronLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { providers, getProvider, getEmbedUrl } from '@/lib/providers';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useIsIOS } from '@/hooks/use-ios';
import { useIsMobile } from '@/hooks/use-mobile';
import { recordWatchHistory } from '@/lib/watch-history';

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
    const handleEnd = () => {
      // iOS native player "Done" button was tapped — fire onClose
      onReturn();
    };
    document.addEventListener('webkitendfullscreen', handleEnd);
    return () => document.removeEventListener('webkitendfullscreen', handleEnd);
  }, [onReturn]);
}

export function VideoPlayer({ src, title, onClose, mediaType, tmdbId, season, episode }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { selectedProvider, setSelectedProvider, selectedMovie, selectedTv } = useAppStore();
  const user = useAuthStore(s => s.user);
  const isIOS = useIsIOS();
  const isMobile = useIsMobile();

  // ── Auto-dismiss loading on mobile (onLoad may never fire for cross-origin iframes) ──
  useEffect(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setLoading(false), isMobile ? 5000 : 10000);
    return () => { if (loadTimerRef.current) clearTimeout(loadTimerRef.current); };
  }, [currentSrc, isMobile]);

  // ── Record watch history to localStorage (all users) + server (logged-in) ──
  useEffect(() => {
    if (!title) return;
    const item = mediaType === 'tv' ? selectedTv : selectedMovie;
    // Always save to localStorage
    recordWatchHistory({
      tmdbId,
      title,
      posterPath: item?.poster_path || null,
      backdropPath: item?.backdrop_path || null,
      mediaType,
      season: season ?? null,
      episode: episode ?? null,
    });
    // Also save to server for logged-in users
    if (user) {
      fetch('/api/profile/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId,
          title,
          posterPath: item?.poster_path || null,
          mediaType,
          season: season ?? null,
          episode: episode ?? null,
        }),
      }).catch(() => {});
    }
  }, [tmdbId, mediaType, season, episode, title, user, selectedMovie, selectedTv]);

  // ── Body scroll lock (iOS-safe: saves/restores scroll position) ──
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

  // ── iOS native fullscreen "Done" button detection ──
  useIOSFullscreenDetect(onClose);

  const switchProvider = (providerId: string) => {
    setSelectedProvider(providerId);
    const newSrc = getEmbedUrl(providerId, mediaType, tmdbId, season, episode);
    setCurrentSrc(newSrc);
    setLoading(true);
    setError(false);
    setShowProviders(false);
    // Re-record watch history on source switch
    const item = mediaType === 'tv' ? selectedTv : selectedMovie;
    recordWatchHistory({
      tmdbId,
      title: title || 'Unknown',
      posterPath: item?.poster_path || null,
      backdropPath: item?.backdrop_path || null,
      mediaType,
      season: season ?? null,
      episode: episode ?? null,
    });
  };

  const activeProvider = getProvider(selectedProvider);

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
      // Silently fail on iOS where Fullscreen API is limited
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showProviders) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, showProviders]);

  // Safe area insets for notch/dynamic island
  const topSafe = 'env(safe-area-inset-top, 0px)';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col ios-player-container"
      >
        {/* iOS: translucent status bar spacer */}
        <div
          className="shrink-0 w-full"
          style={{ height: isIOS ? topSafe : 0 }}
        />

        {/* Top bar — with safe area padding */}
        <div
          className="flex items-center justify-between px-3 md:px-5 h-14 shrink-0 z-10"
          style={{ paddingTop: isIOS ? 'max(4px, env(safe-area-inset-top, 0px) - 10px)' : 0 }}
        >
          {/* iOS: "Done" button top-left (native iOS style) */}
          {isIOS && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white/80 hover:text-white text-sm font-semibold transition-colors active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
              aria-label="Done"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              <span>Done</span>
            </button>
          )}

          {/* Center: title + provider switcher */}
          <div className={`flex items-center gap-3 min-w-0 ${isIOS ? '' : 'flex-1'} ${isIOS ? 'flex-1 justify-center' : ''}`}>
            <h3 className="text-white/80 font-medium text-sm truncate">
              {title || 'Now Playing'}
            </h3>

            {/* Provider switcher button */}
            <div className="relative">
              <button
                onClick={() => setShowProviders(!showProviders)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-white/60 hover:text-white/90 text-xs font-medium transition-all duration-200"
              >
                <Zap className="w-3 h-3" style={{ color: activeProvider.color }} />
                <span className="hidden sm:inline">{activeProvider.name}</span>
                <ChevronDown
                  className={
                    'w-3 h-3 transition-transform duration-200 ' +
                    (showProviders ? 'rotate-180' : '')
                  }
                />
              </button>

              {/* Provider dropdown */}
              <AnimatePresence>
                {showProviders && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProviders(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-60 rounded-xl bg-[#1a1a1a] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden z-20"
                    >
                      <div className="px-3 py-2.5 border-b border-white/[0.06]">
                        <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">
                          Switch Source
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
                                style={{
                                  backgroundColor: p.color + '20',
                                  color: p.color,
                                }}
                              >
                                {p.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-white/90 text-xs font-medium">
                                    {p.name}
                                  </p>
                                  {p.primary && <Crown className="w-3 h-3 text-amber-400" />}
                                </div>
                                <p className="text-white/50 text-[10px] truncate">
                                  {p.description}
                                </p>
                              </div>
                              {isActive && (
                                <div
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: p.color }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side buttons — hide fullscreen on iOS */}
          <div className="flex items-center gap-1">
            {!isIOS && (
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}
            {!isIOS && (
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* iOS: swipe-to-dismiss hint (fades out) */}
        {isIOS && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -10 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="flex justify-center pb-1"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08]">
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <span className="text-white/50 text-[10px] font-medium">
                Swipe down to close
              </span>
              <div className="w-1 h-1 rounded-full bg-white/30" />
            </div>
          </motion.div>
        )}

        {/* 16:9 centered iframe */}
        <div className="flex-1 flex items-center justify-center p-3 md:p-8">
          <div
            ref={containerRef}
            className="relative w-full max-w-6xl aspect-video bg-black overflow-hidden shadow-2xl shadow-black/80 rounded-lg"
          >
            {loading && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80 gap-3 pointer-events-none"
              >
                <Loader2
                  className="w-10 h-10 animate-spin"
                  style={{ color: activeProvider.color }}
                />
                <p className="text-white/50 text-xs font-medium">
                  Loading from {activeProvider.name}...
                </p>
              </motion.div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black">
                <RefreshCw className="w-10 h-10 text-white/20" />
                <p className="text-white/40 text-sm">
                  Unable to load from {activeProvider.name}
                </p>
                <p className="text-white/25 text-xs">
                  Try switching to a different source above.
                </p>
                <button
                  onClick={() => {
                    setError(false);
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
            <iframe
              ref={iframeRef}
              key={currentSrc}
              src={currentSrc}
              className="w-full h-full"
              referrerPolicy="no-referrer"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              playsInline
              style={{ borderRadius: 0 }}
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
        </div>

        {/* iOS: bottom safe area spacer */}
        {isIOS && (
          <div
            className="shrink-0 w-full"
            style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

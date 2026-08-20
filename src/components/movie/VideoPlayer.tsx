'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  ChevronLeft,
  ShieldCheck,
  Server,
  Check,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { providers, getProvider, getEmbedUrl, type Provider } from '@/lib/providers';
import { getRankedProviderIds, getServerScore, recordServerPick } from '@/lib/server-rankings';
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

/* ------------------------------------------------------------------ */
/*  iOS native fullscreen detection                                    */
/* ------------------------------------------------------------------ */
function useIOSFullscreenDetect(onReturn: () => void) {
  useEffect(() => {
    const handleEnd = () => onReturn();
    document.addEventListener('webkitendfullscreen', handleEnd);
    return () => document.removeEventListener('webkitendfullscreen', handleEnd);
  }, [onReturn]);
}

/* ------------------------------------------------------------------ */
/*  Score badge helper                                                 */
/* ------------------------------------------------------------------ */
function scoreBadge(score: number) {
  if (score >= 80) return { label: 'Top Pick', cls: 'bg-emerald-500/20 text-emerald-400' };
  if (score >= 40) return { label: 'Popular', cls: 'bg-amber-500/20 text-amber-400' };
  if (score > 0) return { label: 'Used', cls: 'bg-zinc-500/20 text-zinc-400' };
  return null;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export function VideoPlayer({
  src,
  title,
  onClose,
  mediaType,
  tmdbId,
  season,
  episode,
}: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { selectedProvider, setSelectedProvider, selectedMovie, selectedTv } = useAppStore();
  const user = useAuthStore((s) => s.user);
  const isIOS = useIsIOS();
  const isMobile = useIsMobile();

  // Swipe-to-dismiss (mobile only)
  const dragY = useMotionValue(0);
  const iframeScale = useTransform(dragY, [0, 250], [1, 0.92]);
  const iframeRadius = useTransform(dragY, [0, 250], [8, 24]);

  /* ---------------------------------------------------------------- */
  /*  Ranked provider list                                              */
  /* ---------------------------------------------------------------- */
  const rankedIds = useMemo(() => getRankedProviderIds(), []);
  const rankedSet = useMemo(() => new Set(rankedIds), [rankedIds]);

  const sortedProviders = useMemo(() => {
    const ranked = rankedIds
      .map((id) => providers.find((p) => p.id === id))
      .filter((p): p is Provider => !!p);
    const unranked = providers.filter((p) => !rankedSet.has(p.id));
    return [...ranked, ...unranked];
  }, [rankedIds, rankedSet]);

  const activeProvider = getProvider(selectedProvider);

  /* ---------------------------------------------------------------- */
  /*  Drag end handler                                                  */
  /* ---------------------------------------------------------------- */
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      const shouldClose = info.offset.y > 120 || info.velocity.y > 500;
      if (shouldClose) {
        animate(dragY, 600, {
          duration: 0.25,
          ease: 'easeOut',
          onComplete: onClose,
        });
      } else {
        animate(dragY, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    },
    [dragY, onClose],
  );

  /* ---------------------------------------------------------------- */
  /*  Record watch history                                              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!title) return;
    const item = mediaType === 'tv' ? selectedTv : selectedMovie;
    recordWatchHistory({
      tmdbId,
      title,
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

  /* ---------------------------------------------------------------- */
  /*  Body scroll lock                                                  */
  /* ---------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------- */
  /*  iOS native fullscreen "Done" button                               */
  /* ---------------------------------------------------------------- */
  useIOSFullscreenDetect(onClose);

  /* ---------------------------------------------------------------- */
  /*  Auto-try next server on error                                     */
  /* ---------------------------------------------------------------- */
  const tryNextServer = () => {
    const currentIdx = sortedProviders.findIndex(p => p.id === selectedProvider);
    const next = sortedProviders[(currentIdx + 1) % sortedProviders.length];
    if (next) {
      switchProvider(next.id);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Switch provider                                                   */
  /* ---------------------------------------------------------------- */
  const switchProvider = useCallback(
    (providerId: string) => {
      setSwitchingTo(providerId);
      recordServerPick(providerId);
      setSelectedProvider(providerId);
      const newSrc = getEmbedUrl(providerId, mediaType, tmdbId, season, episode);
      setCurrentSrc(newSrc);
      setLoading(true);
      setError(false);
      setMobileSheetOpen(false);

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

      setTimeout(() => setSwitchingTo(null), 3000);
    },
    [mediaType, tmdbId, season, episode, setSelectedProvider, selectedTv, selectedMovie, title],
  );

  /* ---------------------------------------------------------------- */
  /*  Fullscreen toggle                                                 */
  /* ---------------------------------------------------------------- */
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
      // Fullscreen API unavailable (e.g. iOS)
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Keyboard shortcuts                                                */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mobileSheetOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, mobileSheetOpen]);

  /* ---------------------------------------------------------------- */
  /*  Active server score / badge                                       */
  /* ---------------------------------------------------------------- */
  const activeScore = useMemo(() => getServerScore(selectedProvider), [selectedProvider]);
  const activeBadge = useMemo(() => scoreBadge(activeScore), [activeScore]);
  const isTopRanked = rankedIds[0] === selectedProvider;

  /* ---------------------------------------------------------------- */
  /*  Mobile bottom sheet                                               */
  /* ---------------------------------------------------------------- */
  const mobileSheet = (
    <AnimatePresence>
      {mobileSheetOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 z-20"
            onClick={() => setMobileSheetOpen(false)}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-[#111] rounded-t-2xl z-30 flex flex-col"
            style={{ paddingBottom: isIOS ? 'env(safe-area-inset-bottom, 16px)' : 16 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-white/50" />
                <h4 className="text-white/90 text-sm font-semibold">Servers</h4>
              </div>
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
                aria-label="Close server sheet"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Server list */}
            <div className="flex-1 overflow-y-auto content-scroll px-3 pb-2">
              {sortedProviders.map((p) => {
                const isActive = p.id === selectedProvider;
                const score = getServerScore(p.id);
                const badge = scoreBadge(score);
                const isTop = rankedIds[0] === p.id;
                const isSwitching = switchingTo === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => switchProvider(p.id)}
                    disabled={isSwitching}
                    className={
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ' +
                      (isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]')
                    }
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: p.color + '18', color: p.color }}
                    >
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/90 text-sm font-medium truncate">{p.name}</span>
                        {isTop && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-white/40 text-[11px] truncate mt-0.5">{p.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {badge && (
                        <span className={'px-1.5 py-0.5 rounded text-[9px] font-semibold ' + badge.cls}>
                          {badge.label}
                        </span>
                      )}
                      {isSwitching ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                      ) : isActive ? (
                        <Check className="w-4 h-4" style={{ color: p.color }} />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  /* ================================================================== */
  /*  RENDER                                                            */
  /* ================================================================== */
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
        style={{ y: dragY }}
        drag={isMobile ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.4 }}
        onDragEnd={handleDragEnd}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col ios-player-container"
      >
        {/* iOS: translucent status bar spacer */}
        <div
          className="shrink-0 w-full"
          style={{ height: isIOS ? 'env(safe-area-inset-top, 0px)' : 0 }}
        />

        {/* ==================== TOP BAR ==================== */}
        <div
          className="flex items-center gap-3 px-3 md:px-5 h-12 shrink-0 z-10 justify-between"
          style={{
            paddingTop: isIOS
              ? 'max(2px, env(safe-area-inset-top, 0px) - 10px)'
              : 0,
          }}
        >
          {/* Left: iOS Done button or empty spacer */}
          {isIOS ? (
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
          ) : (
            <div className="w-16" />
          )}

          {/* Center: title + active server pill */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
            <h3 className="text-white/70 font-medium text-sm truncate">
              {title || 'Now Playing'}
            </h3>
            <span
              className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                backgroundColor: activeProvider.color + '20',
                color: activeProvider.color,
              }}
            >
              {isTopRanked && <ShieldCheck className="w-3 h-3" />}
              {activeProvider.name}
            </span>
          </div>

          {/* Right: fullscreen + close (desktop) */}
          <div className="flex items-center gap-1 shrink-0">
            {!isIOS && (
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            {!isIOS && (
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close player"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* iOS swipe hint */}
        {isIOS && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -10 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="flex justify-center pb-1"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08]">
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <span className="text-white/50 text-[10px] font-medium">Swipe down to close</span>
              <div className="w-1 h-1 rounded-full bg-white/30" />
            </div>
          </motion.div>
        )}

        {/* ==================== VIDEO AREA ==================== */}
        <div
          className="flex-1 flex items-center justify-center p-3 md:p-8 relative overflow-hidden"
        >
          <motion.div
            ref={containerRef}
            style={{
              scale: isMobile ? iframeScale : 1,
              borderRadius: isMobile ? iframeRadius : 8,
            }}
            className={
              'relative bg-black overflow-hidden shadow-2xl shadow-black/80 ' +
              (!isMobile ? 'w-full max-w-6xl aspect-video' : 'w-full h-full')
            }
          >
            {/* Loading state: animated pulsing ring */}
            <AnimatePresence>
              {loading && !error && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black gap-4"
                >
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-30"
                      style={{ backgroundColor: activeProvider.color }}
                    />
                    <div
                      className="absolute inset-1 rounded-full animate-pulse opacity-60"
                      style={{ backgroundColor: activeProvider.color }}
                    />
                    <div
                      className="relative w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: activeProvider.color + '25' }}
                    >
                      <Loader2
                        className="w-5 h-5 animate-spin"
                        style={{ color: activeProvider.color }}
                      />
                    </div>
                  </div>
                  <p className="text-white/50 text-xs font-medium">
                    Connecting to {activeProvider.name}...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white/30" />
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-sm font-medium">Unable to load from <span style={{ color: activeProvider.color }}>{activeProvider.name}</span></p>
                  <p className="text-white/25 text-xs mt-1">This server may not have this title</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setError(false);
                      setLoading(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/12 text-white/80 text-sm font-medium transition-colors active:scale-95"
                  >
                    Retry
                  </button>
                  <button
                    onClick={tryNextServer}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                    style={{ backgroundColor: activeProvider.color + '15', color: activeProvider.color }}
                  >
                    Next Server
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Iframe */}
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
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              title={title || 'Video Player'}
            />
          </motion.div>

        </div>

        {/* ==================== MOBILE SERVER STRIP ==================== */}
        {isMobile && (
          <div className="shrink-0 border-t border-white/[0.06] bg-black/80 backdrop-blur-md">
            <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-none">
              {sortedProviders.map((p) => {
                const isActive = p.id === selectedProvider;
                const score = getServerScore(p.id);
                const badge = scoreBadge(score);
                const isTop = rankedIds[0] === p.id;
                const isSwitching = switchingTo === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (isSwitching) return;
                      if (isActive) {
                        setMobileSheetOpen(true);
                      } else {
                        switchProvider(p.id);
                      }
                    }}
                    disabled={isSwitching}
                    className={
                      'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ' +
                      (isActive
                        ? 'border-white/20 bg-white/[0.08] text-white/90'
                        : 'border-white/[0.06] bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/70')
                    }
                  >
                    {isSwitching ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                    )}
                    <span className="truncate max-w-[70px]">{p.name}</span>
                    {isTop && !isSwitching && (
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    )}
                    {badge && !isSwitching && (
                      <span className={badge.cls + ' px-1 py-0 rounded text-[8px] font-bold'}>
                        {badge.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== DESKTOP SERVER STRIP ==================== */}
        {!isMobile && (
          <div className="shrink-0 border-t border-white/[0.06] bg-black/60 backdrop-blur-md px-4 py-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeProvider.color, boxShadow: '0 0 6px ' + activeProvider.color + '60' }} />
              <span className="text-white/40 text-[11px] font-medium">Playing via {activeProvider.name}</span>
              {activeBadge && (
                <span className={"px-2 py-0.5 rounded-full text-[10px] font-semibold border " + activeBadge.cls}>
                  {isTopRanked && <ShieldCheck className="w-3 h-3 mr-1" />}
                  {activeBadge.label}
                </span>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {sortedProviders.map((p) => {
                const isActive = p.id === selectedProvider;
                const isSwitching = switchingTo === p.id;
                const score = getServerScore(p.id);
                const badge = scoreBadge(score);
                const isTop = rankedIds[0] === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (isSwitching) return;
                      switchProvider(p.id);
                    }}
                    disabled={isSwitching}
                    className={
                      'group relative shrink-0 flex items-center gap-2 rounded-lg text-xs font-medium transition-all duration-200 border ' +
                      (isActive ? 'border-white/15 shadow-lg' : 'border-white/[0.06] hover:border-white/12')
                    }
                    style={{
                      backgroundColor: isActive ? p.color + '18' : 'rgba(255,255,255,0.03)',
                      color: isActive ? p.color : 'rgba(255,255,255,0.55)',
                      boxShadow: isActive ? '0 0 20px ' + p.color + '15' : undefined,
                      padding: '7px 12px',
                    }}
                  >
                    <div
                      className={
                        'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ' +
                        (isActive ? '' : 'opacity-70 group-hover:opacity-100')
                      }
                      style={{ backgroundColor: p.color + (isActive ? '25' : '12'), color: p.color }}
                    >
                      {isSwitching ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>{p.icon}</span>}
                    </div>
                    <span className="truncate max-w-[100px] font-medium">{p.name}</span>
                    {isTop && !isSwitching && <ShieldCheck className="w-3 h-3 shrink-0 text-emerald-400" />}
                    {badge && !isSwitching && (
                      <span className={badge.cls + ' px-1.5 py-0.5 rounded text-[8px] font-bold'}>{badge.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== MOBILE BOTTOM SHEET ==================== */}
        {isMobile && mobileSheet}

        {/* ==================== iOS BOTTOM SAFE AREA ==================== */}
        {isIOS && !isMobile && (
          <div
            className="shrink-0 w-full"
            style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

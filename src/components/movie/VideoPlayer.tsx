'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Loader2, ArrowLeft, Play, Tv, ChevronRight,
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
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [activeSeason, setActiveSeason] = useState(season || 1);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { selectedProvider, setSelectedProvider, selectedMovie, selectedTv } = useAppStore();
  const user = useAuthStore(s => s.user);
  const isMobile = useIsMobile();

  const activeProvider = getProvider(selectedProvider);

  // ── Auto-dismiss loading (cross-origin iframes may never fire onLoad) ──
  useEffect(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setLoading(false), isMobile ? 5000 : 10000);
    return () => { if (loadTimerRef.current) clearTimeout(loadTimerRef.current); };
  }, [currentSrc, isMobile]);

  // ── Fetch episodes for TV shows ──
  const fetchEpisodes = useCallback(async (id: number, seasonNum: number) => {
    setEpisodesLoading(true);
    try {
      const res = await fetch(`/api/tmdb/tv/${id}/season/${seasonNum}`);
      const data = await res.json();
      setEpisodes(data.episodes || []);
    } catch {
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mediaType === 'tv') fetchEpisodes(tmdbId, activeSeason);
  }, [mediaType, tmdbId, activeSeason, fetchEpisodes]);

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

  // ── Escape key ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const switchProvider = (providerId: string) => {
    setSelectedProvider(providerId);
    setCurrentSrc(getEmbedUrl(providerId, mediaType, tmdbId, season, episode));
    setLoading(true);
    setError(false);
  };

  const playEpisode = (ep: Episode) => {
    setCurrentSrc(getEmbedUrl(selectedProvider, 'tv', tmdbId, activeSeason, ep.episode_number));
    setLoading(true);
    setError(false);
    useAppStore.getState().setSelectedEpisode(ep);
    // Scroll iframe into view on mobile
    iframeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const switchSeason = (seasonNum: number) => {
    setActiveSeason(seasonNum);
    fetchEpisodes(tmdbId, seasonNum);
  };

  const retry = () => {
    setError(false);
    setLoading(true);
    const sep = currentSrc.includes('?') ? '&' : '?';
    setCurrentSrc(currentSrc + sep + '_r=' + Date.now());
  };

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
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col overflow-hidden"
      >
        {/* ═══════ HEADER ═══════ */}
        <div className="flex items-center justify-between px-2 sm:px-3 h-12 sm:h-11 shrink-0 border-b border-white/[0.06] bg-[#0a0a0a]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 -ml-1 rounded-lg text-white/60 hover:text-white active:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h3 className="text-white/70 text-sm font-medium truncate max-w-[50%] text-center">
            {title || 'Now Playing'}
          </h3>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 -mr-1 rounded-lg text-white/50 hover:text-white active:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ═══════ SERVER TABS ═══════ */}
        <div className="shrink-0 border-b border-white/[0.06] bg-[#0a0a0a]">
          <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
            {providers.map((p) => {
              const isActive = p.id === selectedProvider;
              return (
                <button
                  key={p.id}
                  onClick={() => switchProvider(p.id)}
                  className={
                    'shrink-0 flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-lg text-xs sm:text-[11px] font-medium transition-all duration-150 border min-h-[36px] sm:min-h-0 ' +
                    (isActive
                      ? 'border-white/10 text-white bg-white/10'
                      : 'border-transparent text-white/40 active:text-white/70 active:bg-white/[0.06]')
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isActive ? p.color : p.color + '50' }}
                  />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════ IFRAME ═══════ */}
        <div className="relative flex-1 min-h-0 bg-black">
          {/* Loading spinner (behind iframe, pointer-events-none) */}
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: activeProvider.color }} />
                <p className="text-white/30 text-xs">Loading from {activeProvider.name}...</p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-[2] bg-[#0a0a0a]">
              <p className="text-white/40 text-sm">Failed to load from {activeProvider.name}</p>
              <p className="text-white/25 text-xs">Try a different server above.</p>
              <button
                onClick={retry}
                className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={currentSrc}
            src={currentSrc}
            className="absolute inset-0 w-full h-full"
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

        {/* ═══════ STATUS BAR ═══════ */}
        <div className="shrink-0 flex items-center justify-between px-3 h-10 sm:h-9 border-t border-white/[0.06] bg-[#0a0a0a]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center gap-2 min-w-0">
            {loading && !error && (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: activeProvider.color }} />
            )}
            <span className="text-white/30 text-xs sm:text-[11px] truncate">
              {error ? 'Failed to load' : loading ? `Connecting to ${activeProvider.name}...` : epLabel || `Playing on ${activeProvider.name}`}
            </span>
            {currentEp && !loading && !error && (
              <span className="text-white/20 text-xs sm:text-[11px] truncate hidden sm:inline">• {currentEp.name}</span>
            )}
          </div>
          {mediaType === 'tv' && (
            <button
              onClick={() => setShowEpisodes(!showEpisodes)}
              className="flex items-center gap-1.5 px-3 py-1.5 -mr-1 rounded-lg text-white/50 active:text-white active:bg-white/10 text-xs font-medium transition-colors shrink-0"
            >
              {showEpisodes ? 'Hide' : 'Episodes'}
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showEpisodes ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>

        {/* ═══════ EPISODE LIST (TV only) ═══════ */}
        <AnimatePresence>
          {showEpisodes && mediaType === 'tv' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="shrink-0 border-t border-white/[0.06] bg-[#0d0d0d] overflow-hidden"
            >
              <div className="max-h-[40vh] overflow-y-auto content-scroll">
                {/* Season tabs */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.04] overflow-x-auto no-scrollbar">
                  <Tv className="w-3.5 h-3.5 text-white/30 shrink-0 mr-0.5" />
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((s) => (
                    <button
                      key={s}
                      onClick={() => switchSeason(s)}
                      className={
                        'shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] ' +
                        (activeSeason === s
                          ? 'bg-white/10 text-white'
                          : 'text-white/30 active:text-white/60 active:bg-white/[0.06]')
                      }
                    >
                      S{s}
                    </button>
                  ))}
                </div>

                {/* Episodes */}
                {episodesLoading ? (
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-14 bg-white/[0.03] rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : episodes.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-white/20 text-xs">
                    No episodes found
                  </div>
                ) : (
                  <div className="p-2 sm:p-2 space-y-1">
                    {episodes.map((ep) => {
                      const isCurrent = ep.episode_number === episode;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => playEpisode(ep)}
                          className={
                            'w-full flex items-center gap-3 p-2.5 sm:p-2 rounded-xl text-left transition-colors group ' +
                            (isCurrent
                              ? 'bg-white/[0.06]'
                              : 'active:bg-white/[0.04]')
                          }
                        >
                          {/* Thumbnail */}
                          <div className="relative w-24 sm:w-24 aspect-video rounded-lg overflow-hidden bg-white/[0.04] shrink-0">
                            {ep.still_path ? (
                              <img
                                src={getImageUrl(ep.still_path, 'w300')}
                                alt={ep.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-4 h-4 text-white/10" />
                              </div>
                            )}
                            {isCurrent && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                                  <div className="w-0 h-0 border-l-[6px] border-y-[4px] border-y-transparent border-l-white ml-0.5" />
                                </div>
                              </div>
                            )}
                            {!isCurrent && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 py-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-mono ${isCurrent ? 'text-white/60' : 'text-white/30'}`}>
                                E{String(ep.episode_number).padStart(2, '0')}
                              </span>
                              {ep.runtime && (
                                <span className="text-white/20 text-[10px]">{ep.runtime}m</span>
                              )}
                            </div>
                            <p className={`text-[13px] sm:text-xs font-medium truncate mt-0.5 ${isCurrent ? 'text-white' : 'text-white/60'}`}>
                              {ep.name}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Loader2, ArrowLeft, Play, Tv, ChevronUp,
  Zap, AlertTriangle, RefreshCw, MonitorPlay, LayoutGrid,
  Star, Calendar, Clock, Film, Minus,
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

function useIOSFullscreenDetect(onReturn: () => void) {
  useEffect(() => {
    const h = () => onReturn();
    document.addEventListener('webkitendfullscreen', h);
    return () => document.removeEventListener('webkitendfullscreen', h);
  }, [onReturn]);
}

/* Animated equalizer bars for "now playing" indicator */
function PlayingBars({ color, size = 'sm' }: { color: string; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-3' : 'h-4';
  const gap = size === 'sm' ? 'gap-[2px]' : 'gap-[3px]';
  const barW = size === 'sm' ? 'w-[3px]' : 'w-[4px]';
  return (
    <div className={`flex items-end ${gap} ${h}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${barW} rounded-full`}
          style={{ backgroundColor: color }}
          animate={{ height: ['40%', '100%', '60%', '100%', '40%'] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function VideoPlayer({ src, title, onClose, mediaType, tmdbId, season, episode }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [eps, setEps] = useState<Episode[]>([]);
  const [epsLoading, setEpsLoading] = useState(false);
  const [showEps, setShowEps] = useState(mediaType === 'tv');
  const [curSrc, setCurSrc] = useState(src);
  const [curSeason, setCurSeason] = useState(season || 1);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const serverMenuRef = useRef<HTMLDivElement>(null);
  const { selectedProvider, setSelectedProvider, selectedMovie, selectedTv } = useAppStore();
  const user = useAuthStore(s => s.user);
  const isMobile = useIsMobile();
  const provider = getProvider(selectedProvider);

  /* Content info from store */
  const contentItem = mediaType === 'tv' ? selectedTv : selectedMovie;
  const contentYear = mediaType === 'movie'
    ? (selectedMovie?.release_date || '').split('-')[0]
    : (selectedTv?.first_air_date || '').split('-')[0];
  const contentRating = contentItem?.vote_average;
  const contentPoster = contentItem?.poster_path;
  const contentRuntime = selectedMovie?.runtime;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLoading(false), isMobile ? 5000 : 10000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [curSrc, isMobile]);

  const fetchEps = useCallback(async (id: number, s: number) => {
    setEpsLoading(true);
    try {
      const r = await fetch(`/api/tmdb/tv/${id}/season/${s}`);
      const d = await r.json();
      setEps(d.episodes || []);
    } catch { setEps([]); }
    finally { setEpsLoading(false); }
  }, []);

  useEffect(() => {
    if (mediaType === 'tv') fetchEps(tmdbId, curSeason);
  }, [mediaType, tmdbId, curSeason, fetchEps]);

  useEffect(() => {
    if (!title) return;
    const item = mediaType === 'tv' ? selectedTv : selectedMovie;
    recordWatchHistory({ tmdbId, title, posterPath: item?.poster_path || null, backdropPath: item?.backdrop_path || null, mediaType, season: season ?? null, episode: episode ?? null });
    if (user) { fetch('/api/profile/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tmdbId, title, posterPath: item?.poster_path || null, mediaType, season: season ?? null, episode: episode ?? null }) }).catch(() => {}); }
  }, [tmdbId, mediaType, season, episode, title, user, selectedMovie, selectedTv]);

  useEffect(() => {
    const y = window.scrollY;
    document.body.style.setProperty('--player-scroll-y', `${y}px`);
    document.body.classList.add('player-open');
    document.body.style.top = `-${y}px`;
    return () => { document.body.classList.remove('player-open'); document.body.style.top = ''; window.scrollTo(0, y); };
  }, []);

  useIOSFullscreenDetect(onClose);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  /* Close server menu on outside click */
  useEffect(() => {
    if (!showServerMenu) return;
    const handler = (e: MouseEvent) => {
      if (serverMenuRef.current && !serverMenuRef.current.contains(e.target as Node)) {
        setShowServerMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showServerMenu]);

  const switchServer = (id: string) => {
    setSelectedProvider(id);
    setCurSrc(getEmbedUrl(id, mediaType, tmdbId, season, episode));
    setLoading(true); setError(false);
    setShowServerMenu(false);
  };

  const playEp = (ep: Episode) => {
    setCurSrc(getEmbedUrl(selectedProvider, 'tv', tmdbId, curSeason, ep.episode_number));
    setLoading(true); setError(false);
    useAppStore.getState().setSelectedEpisode(ep);
  };

  const doRetry = () => {
    setError(false); setLoading(true);
    const sep = curSrc.includes('?') ? '&' : '?';
    setCurSrc(curSrc + sep + '_r=' + Date.now());
  };

  const curEp = eps.find(e => e.episode_number === episode);
  const epLabel = mediaType === 'tv' && season && episode ? `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}` : '';

  /* ── Tier labels for server groups ── */
  const tierLabels = ['Recommended', 'Alternatives', 'Fallbacks'] as const;
  const tierProviders = [
    providers.slice(0, 3),
    providers.slice(3, 8),
    providers.slice(8),
  ];

  /* ── Episode panel content (shared between mobile & desktop) ── */
  const epsContent = (
    <div className="flex flex-col h-full">
      {/* Season tabs */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-b border-white/[0.06] overflow-x-auto no-scrollbar shrink-0">
        <LayoutGrid className="w-3.5 h-3.5 text-white/20 shrink-0 mr-1" />
        {Array.from({ length: 20 }, (_, i) => i + 1).map((s) => (
          <button
            key={s}
            onClick={() => { setCurSeason(s); fetchEps(tmdbId, s); }}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 min-h-[34px] ${
              curSeason === s
                ? 'bg-white text-black shadow-sm'
                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.06] active:text-white/80 active:bg-white/10'
            }`}
          >S{s}</button>
        ))}
      </div>

      {/* Episode list */}
      <div className="flex-1 overflow-y-auto content-scroll">
        {epsLoading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] bg-white/[0.03] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : eps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20 text-xs gap-2">
            <Tv className="w-6 h-6" />
            <span>No episodes found</span>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {eps.map((ep) => {
              const cur = ep.episode_number === episode;
              return (
                <button
                  key={ep.id}
                  onClick={() => playEp(ep)}
                  className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left transition-all duration-200 group ${
                    cur
                      ? 'bg-white/[0.08] ring-1 ring-white/[0.06]'
                      : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-[88px] aspect-video rounded-xl overflow-hidden bg-white/[0.04] shrink-0">
                    {ep.still_path ? (
                      <img
                        src={getImageUrl(ep.still_path, 'w300')}
                        alt={ep.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.03] to-white/[0.06]">
                        <Play className="w-4 h-4 text-white/10" />
                      </div>
                    )}

                    {/* Currently playing overlay */}
                    {cur && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                        <PlayingBars color={provider.color} />
                      </div>
                    )}

                    {/* Hover play overlay */}
                    {!cur && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40">
                        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Runtime badge */}
                    {ep.runtime && (
                      <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[9px] text-white/70 font-medium">
                        {ep.runtime}m
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-mono font-semibold tabular-nums ${cur ? 'text-white/50' : 'text-white/25'}`}>
                        E{String(ep.episode_number).padStart(2, '0')}
                      </span>
                      {ep.vote_average > 0 && (
                        <span className="text-[10px] text-amber-400/70 font-medium">
                          ★ {ep.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-medium truncate mt-0.5 ${cur ? 'text-white' : 'text-white/50'}`}>
                      {ep.name}
                    </p>
                    {ep.overview && (
                      <p className="text-[10px] text-white/20 line-clamp-1 mt-0.5 leading-relaxed">
                        {ep.overview}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  /* ── Server selector dropdown ── */
  const serverMenu = (
    <AnimatePresence>
      {showServerMenu && (
        <motion.div
          ref={serverMenuRef}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute bottom-full left-0 mb-2 w-[280px] bg-[#141414]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">Select Server</p>
          </div>
          <div className="max-h-[340px] overflow-y-auto content-scroll py-1.5">
            {tierProviders.map((tier, tIdx) => (
              <div key={tIdx}>
                <div className="px-4 pt-2 pb-1">
                  <p className="text-white/20 text-[10px] font-semibold uppercase tracking-widest">{tierLabels[tIdx]}</p>
                </div>
                {tier.map((p) => {
                  const active = p.id === selectedProvider;
                  return (
                    <button
                      key={p.id}
                      onClick={() => switchServer(p.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 ${
                        active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs"
                        style={{ backgroundColor: active ? p.color + '25' : 'rgba(255,255,255,0.04)' }}
                      >
                        <span style={{ color: active ? p.color : 'rgba(255,255,255,0.3)' }}>{p.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${active ? 'text-white' : 'text-white/60'}`}>
                            {p.name}
                          </span>
                          {p.primary && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-400/10 text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                              Best
                            </span>
                          )}
                        </div>
                        <p className="text-white/25 text-[11px] truncate">{p.description}</p>
                      </div>
                      {active && (
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ── Content info card (expandable) ── */
  const contentInfoCard = (
    <AnimatePresence>
      {showInfo && contentItem && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden"
        >
          <div className="px-4 py-3 border-t border-white/[0.05]">
            <div className="flex gap-3">
              {/* Poster thumbnail */}
              {contentPoster && (
                <div className="w-12 h-[68px] rounded-lg overflow-hidden bg-white/[0.04] shrink-0 border border-white/[0.06]">
                  <img
                    src={getImageUrl(contentPoster, 'w92')}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-semibold truncate">{title || 'Now Playing'}</h4>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                  {contentYear && (
                    <span className="flex items-center gap-1 text-white/40 text-xs">
                      <Calendar className="w-3 h-3" />{contentYear}
                    </span>
                  )}
                  {contentRating && contentRating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400/80 text-xs font-medium">
                      <Star className="w-3 h-3 fill-amber-400" />{contentRating.toFixed(1)}
                    </span>
                  )}
                  {contentRuntime && contentRuntime > 0 && (
                    <span className="flex items-center gap-1 text-white/40 text-xs">
                      <Clock className="w-3 h-3" />{Math.floor(contentRuntime / 60)}h {contentRuntime % 60}m
                    </span>
                  )}
                  {mediaType === 'tv' && epLabel && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider"
                      style={{ backgroundColor: provider.color + '20', color: provider.color }}
                    >
                      {epLabel}
                    </span>
                  )}
                </div>
                {contentItem?.overview && (
                  <p className="text-white/30 text-xs leading-relaxed line-clamp-2 mt-1.5">
                    {contentItem.overview}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-[#050505] flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* ── Header — safe from Dynamic Island ── */}
        <div className="flex items-center justify-between px-2 sm:px-4 h-12 sm:h-11 shrink-0 z-10 backdrop-blur-xl bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 -ml-1 rounded-xl text-white/60 hover:text-white active:text-white active:bg-white/10 transition-all duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Center: episode badge + title */}
          <div className="flex items-center gap-2.5 min-w-0 max-w-[60%]">
            {epLabel && (
              <span
                className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase"
                style={{ backgroundColor: provider.color + '20', color: provider.color }}
              >
                {epLabel}
              </span>
            )}
            <h3 className="text-white/80 text-sm font-semibold truncate">
              {title || 'Now Playing'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 -mr-1 rounded-xl text-white/30 hover:text-white/70 active:text-white active:bg-white/10 transition-all duration-200"
            aria-label="Close"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* ── Main content area ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Video iframe area */}
            <div className="relative flex-1 min-h-0 bg-black">
              {/* Loading overlay */}
              <AnimatePresence>
                {loading && !error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none bg-black/40"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: provider.color + '15' }}
                        >
                          <Loader2
                            className="w-7 h-7 animate-spin"
                            style={{ color: provider.color }}
                          />
                        </div>
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          style={{ border: `2px solid ${provider.color}30` }}
                          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.08, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-white/50 text-sm font-medium">Connecting to {provider.name}</p>
                        <p className="text-white/25 text-xs mt-1">Please wait...</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error overlay */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-[2] bg-[#050505]"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    >
                      <AlertTriangle className="w-7 h-7 text-red-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 text-sm font-medium">Failed to load stream</p>
                      <p className="text-white/30 text-xs mt-1">{provider.name} couldn't serve this content</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={doRetry}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] active:bg-white/[0.16] text-white text-sm font-medium transition-all duration-200"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry
                      </button>
                      <button
                        onClick={() => setShowServerMenu(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.08] text-sm font-medium transition-all duration-200"
                      >
                        <MonitorPlay className="w-3.5 h-3.5" />
                        Switch Server
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <iframe
                ref={iframeRef}
                key={curSrc}
                src={curSrc}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                playsInline
                onLoad={() => { setLoading(false); if (timerRef.current) clearTimeout(timerRef.current); }}
                onError={() => { setLoading(false); setError(true); }}
                title={title || 'Video Player'}
              />
            </div>

            {/* ── Bottom controls bar ── */}
            <div
              className="shrink-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.05]"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              {/* Content info toggle row */}
              <div className="flex items-center px-3 pt-2.5 gap-2">
                {/* Server selector trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowServerMenu(!showServerMenu)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                      showServerMenu
                        ? 'border-white/15 bg-white/[0.08] text-white'
                        : 'border-white/[0.06] bg-white/[0.04] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" style={{ color: provider.color }} />
                    <span className="hidden sm:inline">{provider.name}</span>
                    <span className="sm:hidden">Server</span>
                    <ChevronUp className={`w-3 h-3 transition-transform duration-200 ${showServerMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {serverMenu}
                </div>

                {/* Status with playing indicator */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {loading && !error && (
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ color: provider.color }} />
                  )}
                  {!loading && !error && !showServerMenu && (
                    <PlayingBars color={provider.color} />
                  )}
                  <span className="text-white/25 text-[11px] truncate">
                    {error ? 'Connection failed' : loading ? 'Connecting...' : curEp?.name || epLabel || ('Playing on ' + provider.name)}
                  </span>
                </div>

                {/* Info toggle */}
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 border ${
                    showInfo
                      ? 'border-white/10 bg-white/[0.06] text-white'
                      : 'border-transparent text-white/40 active:text-white active:bg-white/[0.06]'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Info</span>
                </button>

                {/* Episodes toggle (TV only, mobile) */}
                {mediaType === 'tv' && isMobile && (
                  <button
                    onClick={() => setShowEps(!showEps)}
                    className={`flex items-center gap-1.5 px-3 py-2 -mr-1 rounded-xl text-[11px] font-semibold transition-all duration-200 border ${
                      showEps
                        ? 'border-white/10 bg-white/[0.06] text-white'
                        : 'border-transparent text-white/40 active:text-white active:bg-white/[0.06]'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Episodes</span>
                  </button>
                )}

                {/* Episodes toggle (TV, desktop) */}
                {mediaType === 'tv' && !isMobile && (
                  <button
                    onClick={() => setShowEps(!showEps)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 border ${
                      showEps
                        ? 'border-white/10 bg-white/[0.06] text-white'
                        : 'border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Episodes
                  </button>
                )}
              </div>

              {/* Expandable content info */}
              {contentInfoCard}

              <div className="h-1" />
            </div>
          </div>

          {/* ── Desktop episode sidebar ── */}
          <AnimatePresence>
            {!isMobile && mediaType === 'tv' && showEps && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 360, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="shrink-0 border-l border-white/[0.06] bg-[#0a0a0a] flex flex-col min-h-0 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-white/40" />
                    <h4 className="text-white/70 text-sm font-semibold">Episodes</h4>
                    <span className="text-white/20 text-xs">{eps.length}</span>
                  </div>
                  <button
                    onClick={() => setShowEps(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 active:text-white active:bg-white/10 transition-all duration-200"
                    aria-label="Close episodes"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {epsContent}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Mobile episode bottom sheet ── */}
        <AnimatePresence>
          {isMobile && showEps && mediaType === 'tv' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="shrink-0 border-t border-white/[0.06] bg-[#0a0a0a] overflow-hidden"
            >
              <div className="flex justify-center py-2">
                <div className="w-8 h-1 rounded-full bg-white/15" />
              </div>
              <div className="max-h-[45vh] overflow-hidden flex flex-col -mt-1">
                {epsContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

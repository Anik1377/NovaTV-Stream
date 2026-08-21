'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Loader2, ArrowLeft, Play, Tv, ChevronDown, ChevronUp,
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

export function VideoPlayer({ src, title, onClose, mediaType, tmdbId, season, episode }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [eps, setEps] = useState<Episode[]>([]);
  const [epsLoading, setEpsLoading] = useState(false);
  const [showEps, setShowEps] = useState(mediaType === 'tv');
  const [curSrc, setCurSrc] = useState(src);
  const [curSeason, setCurSeason] = useState(season || 1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { selectedProvider, setSelectedProvider, selectedMovie, selectedTv } = useAppStore();
  const user = useAuthStore(s => s.user);
  const isMobile = useIsMobile();
  const provider = getProvider(selectedProvider);

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

  const switchServer = (id: string) => {
    setSelectedProvider(id);
    setCurSrc(getEmbedUrl(id, mediaType, tmdbId, season, episode));
    setLoading(true); setError(false);
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

  const epsContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-3 py-2.5 border-b border-white/[0.06] overflow-x-auto no-scrollbar shrink-0">
        <Tv className="w-3.5 h-3.5 text-white/25 shrink-0 mr-0.5" />
        {Array.from({ length: 20 }, (_, i) => i + 1).map((s) => (
          <button
            key={s}
            onClick={() => { setCurSeason(s); fetchEps(tmdbId, s); }}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[34px] ${curSeason === s ? 'bg-white/10 text-white' : 'text-white/30 active:text-white/60 active:bg-white/[0.06]'}`}
          >{'S' + s}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto content-scroll">
        {epsLoading ? (
          <div className="p-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />)}</div>
        ) : eps.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-white/20 text-xs">No episodes found</div>
        ) : (
          <div className="p-2 space-y-1">
            {eps.map((ep) => {
              const cur = ep.episode_number === episode;
              return (
                <button
                  key={ep.id}
                  onClick={() => playEp(ep)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors group ${cur ? 'bg-white/[0.07]' : 'active:bg-white/[0.04]'}`}
                >
                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-white/[0.04] shrink-0">
                    {ep.still_path ? (
                      <img src={getImageUrl(ep.still_path, 'w300')} alt={ep.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Play className="w-4 h-4 text-white/10" /></div>
                    )}
                    {cur && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[6px] border-y-[4px] border-y-transparent border-l-white ml-0.5" />
                        </div>
                      </div>
                    )}
                    {!cur && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-mono ${cur ? 'text-white/60' : 'text-white/30'}`}>{'E' + String(ep.episode_number).padStart(2, '0')}</span>
                      {ep.runtime && <span className="text-white/20 text-[10px]">{ep.runtime}m</span>}
                    </div>
                    <p className={`text-xs font-medium truncate mt-0.5 ${cur ? 'text-white' : 'text-white/60'}`}>{ep.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col"
      >
        <div className="flex items-center justify-between px-3 h-12 sm:h-11 shrink-0 bg-[#0a0a0a] z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button onClick={onClose} className="flex items-center justify-center w-10 h-10 -ml-1 rounded-lg text-white/60 active:text-white active:bg-white/10 transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-white/70 text-sm font-medium truncate max-w-[50%] text-center">{title || 'Now Playing'}</h3>
          <button onClick={onClose} className="flex items-center justify-center w-10 h-10 -mr-1 rounded-lg text-white/40 active:text-white active:bg-white/10 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <div className="relative flex-1 min-h-0 bg-black">
              {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: provider.color }} />
                    <p className="text-white/30 text-xs">Loading...</p>
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-[2] bg-[#0a0a0a]">
                  <p className="text-white/40 text-sm">Failed to load from {provider.name}</p>
                  <p className="text-white/25 text-xs">Try a different server.</p>
                  <button onClick={doRetry} className="px-5 py-2 rounded-xl bg-white/10 active:bg-white/20 text-white text-sm font-medium transition-colors">Retry</button>
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={curSrc}
                src={curSrc}
                className="absolute inset-0 w-full h-full"
                referrerPolicy="no-referrer"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                playsInline
                onLoad={() => { setLoading(false); if (timerRef.current) clearTimeout(timerRef.current); }}
                onError={() => { setLoading(false); setError(true); }}
                title={title || 'Video Player'}
              />
            </div>

            <div className="shrink-0 bg-[#0a0a0a]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-2 overflow-x-auto no-scrollbar">
                {providers.map((p) => {
                  const active = p.id === selectedProvider;
                  return (
                    <button
                      key={p.id}
                      onClick={() => switchServer(p.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border min-h-[36px] sm:min-h-0 ${active ? 'border-white/10 text-white bg-white/10' : 'border-transparent text-white/40 active:text-white/70 active:bg-white/[0.06]'}`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: active ? p.color : p.color + '50' }} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between px-3 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  {loading && !error && <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ color: provider.color }} />}
                  <span className="text-white/25 text-[11px] truncate">{error ? 'Failed' : loading ? 'Connecting...' : epLabel || ('Playing on ' + provider.name)}</span>
                  {curEp && !loading && !error && (
                    <span className="text-white/15 text-[11px] truncate hidden sm:inline">{'• ' + curEp.name}</span>
                  )}
                </div>
                {mediaType === 'tv' && isMobile && (
                  <button onClick={() => setShowEps(!showEps)} className="flex items-center gap-1 px-2.5 py-1.5 -mr-1 rounded-lg text-white/40 active:text-white active:bg-white/10 text-[11px] font-medium transition-colors">
                    {showEps ? 'Hide' : 'Episodes'}
                    {showEps ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isMobile && mediaType === 'tv' && showEps && (
            <div className="w-[340px] shrink-0 border-l border-white/[0.06] bg-[#0d0d0d] flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
                <h4 className="text-white/60 text-sm font-semibold">Episodes</h4>
                <button onClick={() => setShowEps(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 active:text-white active:bg-white/10 transition-colors" aria-label="Close episodes">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {epsContent}
            </div>
          )}
        </div>

        <AnimatePresence>
          {isMobile && showEps && mediaType === 'tv' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="shrink-0 border-t border-white/[0.06] bg-[#0d0d0d] overflow-hidden"
            >
              <div className="max-h-[45vh] overflow-hidden flex flex-col">
                {epsContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

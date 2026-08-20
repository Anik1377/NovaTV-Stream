'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, Clock, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import type { Movie } from '@/lib/types';

interface PreviewData {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  number_of_seasons: number | null;
  genres: { id: number; name: string }[];
  tagline: string;
  cast: { name: string; character: string; profile_path: string | null }[];
  trailer_key: string | null;
}

interface HoverPreviewCardProps {
  movie: Movie;
  children: React.ReactNode;
}

const HOVER_DELAY = 700;
const POPUP_W = 400;
const POPUP_H = 480;
const cache = new Map<string, { data: PreviewData; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function HoverPreviewCard({ movie, children }: HoverPreviewCardProps) {
  const { selectMovie, selectTv } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isTv = movie.media_type === 'tv' || !!movie.first_air_date;
  const mediaType = isTv ? 'tv' : 'movie';
  const cacheKey = `${movie.id}-${mediaType}`;

  const updatePosition = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.left + rect.width / 2 - POPUP_W / 2;
    let top = rect.bottom + 10;

    // Clamp horizontal
    if (left < 12) left = 12;
    if (left + POPUP_W > vw - 12) left = vw - POPUP_W - 12;

    // If popup overflows bottom, try above
    if (top + POPUP_H > vh - 20) {
      const aboveTop = rect.top - POPUP_H - 10;
      if (aboveTop > 8) {
        top = aboveTop;
      }
      // else: keep below (partial visibility is better than top-of-screen)
    }

    setPos({ top, left });
  }, []);

  const handleEnter = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(true);
      updatePosition();

      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setData(cached.data);
        return;
      }

      setLoading(true);
      fetch(`/api/tmdb/preview?id=${movie.id}&type=${mediaType}`)
        .then((r) => r.json())
        .then((d: PreviewData) => {
          setData(d);
          cache.set(cacheKey, { data: d, ts: Date.now() });
          updatePosition();
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, HOVER_DELAY);
  }, [movie.id, mediaType, cacheKey, updatePosition]);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  const handleLeave = useCallback(() => {
    setTimeout(() => {
      if (popupRef.current?.matches(':hover')) return;
      dismiss();
    }, 100);
  }, [dismiss]);

  const handleCardClick = useCallback(() => {
    if (isTv) {
      selectTv({ ...movie, name: movie.name || movie.title || '' });
    } else {
      selectMovie(movie);
    }
  }, [movie, isTv, selectMovie, selectTv]);

  useEffect(() => {
    if (!visible) return;
    // Update position after render + slight delay for layout
    const id = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(id);
  }, [visible, updatePosition]);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => {
      updatePosition();
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [visible, updatePosition]);

  useEffect(() => {
    if (!visible) return;
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visible, updatePosition]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const title = data?.title || movie.title || movie.name || 'Unknown';
  const year = (data?.release_date || movie.release_date || movie.first_air_date || '').split('-')[0];
  const rating = (data?.vote_average || movie.vote_average)?.toFixed(1);
  const backdrop = data?.backdrop_path || movie.backdrop_path;
  const genres = data?.genres || [];
  const cast = data?.cast || [];
  const trailerKey = data?.trailer_key;
  const hasTrailer = !!trailerKey;

  const popupContent = visible ? (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, y: 12, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.92 }}
      transition={{ duration: 0.25 }}
      className="fixed z-[200] hidden md:block"
      style={{ top: pos.top, left: pos.left, width: Math.min(400, window.innerWidth - 24), pointerEvents: 'auto' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="absolute -inset-4 rounded-2xl bg-black/40 blur-2xl" />
      <div className="relative bg-[#18181b] rounded-xl overflow-hidden shadow-2xl shadow-black/80 border border-white/[0.08]">
        <div className="relative aspect-video w-full bg-black">
          {hasTrailer && (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailerKey}&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={`${title} trailer`}
            />
          )}
          {!hasTrailer && backdrop && (
            <>
              <img src={getImageUrl(backdrop, 'w780')} alt={title} className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/30 to-transparent" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-black/20 pointer-events-none" />
          {hasTrailer && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-sm pointer-events-none">
              <Volume2 className="w-3 h-3 text-white/50" />
              <span className="text-[10px] text-white/50 font-medium">Muted</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-sm">
              {isTv ? 'TV Series' : 'Movie'}
            </span>
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#18181b]/70 z-10">
              <Loader2 className="w-6 h-6 text-white/70 animate-spin" />
            </div>
          )}
          {!hasTrailer && !backdrop && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/50 text-sm">No preview available</span>
            </div>
          )}
        </div>
        <div className="p-4 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <h3 className="text-[15px] font-bold text-white leading-tight line-clamp-2 flex-1">{title}</h3>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="More Info"
              >
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {rating && parseFloat(rating) > 0 && (
              <span className="text-green-400 font-semibold">{Math.round(parseFloat(rating) * 10)}% Match</span>
            )}
            {year && (
              <span className="text-white/50 flex items-center gap-1">
                <Calendar className="w-3 h-3" />{year}
              </span>
            )}
            {data?.runtime && (
              <span className="text-white/50 flex items-center gap-1">
                <Clock className="w-3 h-3" />{data.runtime}m
              </span>
            )}
            {data?.number_of_seasons && (
              <span className="px-1.5 py-0.5 rounded border border-white/20 text-white/50 text-[10px]">
                {data.number_of_seasons} Season{data.number_of_seasons > 1 ? 's' : ''}
              </span>
            )}
            <span className="text-white/50">HD</span>
          </div>
          {genres.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {genres.slice(0, 3).map((g) => (
                <span key={g.id} className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/8 text-white/60">{g.name}</span>
              ))}
            </div>
          )}
          <p className="text-[13px] text-white/50 leading-relaxed line-clamp-3">
            {data?.overview || movie.overview}
          </p>
          {cast.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/40 shrink-0">Cast:</span>
              <div className="flex items-center gap-1.5 overflow-hidden">
                {cast.slice(0, 4).map((c) => (
                  <span key={c.name} className="text-[11px] text-white/60 whitespace-nowrap">{c.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  ) : null;

  return (
    <>
      <div
        ref={cardRef}
        className="relative"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {children}
      </div>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>{popupContent}</AnimatePresence>,
        document.body
      )}
    </>
  );
}

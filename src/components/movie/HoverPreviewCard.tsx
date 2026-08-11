'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Star, Clock, Calendar, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import type { Movie } from '@/lib/types';
import { TrailerModal } from './TrailerModal';

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
const cache = new Map<string, { data: PreviewData; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function HoverPreviewCard({ movie, children }: HoverPreviewCardProps) {
  const { selectMovie, selectTv } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isTv = movie.media_type === 'tv' || !!movie.first_air_date;
  const mediaType = isTv ? 'tv' : 'movie';
  const cacheKey = `${movie.id}-${mediaType}`;

  const handleEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setVisible(true);

      // Check cache
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
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, HOVER_DELAY);
  }, [movie.id, mediaType, cacheKey]);

  const handleLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  const handleClick = useCallback(() => {
    if (isTv) {
      selectTv({ ...movie, name: movie.name || movie.title || '' });
    } else {
      selectMovie(movie);
    }
  }, [movie, isTv, selectMovie, selectTv]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const title = data?.title || movie.title || movie.name || 'Unknown';
  const year = (data?.release_date || movie.release_date || movie.first_air_date || '').split('-')[0];
  const rating = (data?.vote_average || movie.vote_average)?.toFixed(1);
  const backdrop = data?.backdrop_path || movie.backdrop_path;
  const genres = data?.genres || [];
  const cast = data?.cast || [];

  return (
    <>
      <div
        ref={cardRef}
        className="relative"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {children}

        {/* Preview popup */}
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute left-1/2 -translate-x-1/2 z-50 w-[320px] sm:w-[360px] md:w-[400px] hidden md:block"
              style={{
                top: '100%',
                marginTop: '8px',
                pointerEvents: 'auto',
              }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              {/* Shadow / glow under card */}
              <div
                className="absolute -inset-3 rounded-2xl blur-xl opacity-30"
                style={{ backgroundColor: backdrop ? 'transparent' : '#1a1a1a' }}
              />

              <div className="relative bg-[#18181b] rounded-xl overflow-hidden shadow-2xl shadow-black/70 border border-white/10">
                {/* Backdrop image */}
                {backdrop ? (
                  <div className="relative aspect-video w-full">
                    <img
                      src={getImageUrl(backdrop, 'w780')}
                      alt={title}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/40 to-transparent" />

                    {/* Play Trailer button */}
                    {data?.trailer_key && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrailerKey(data.trailer_key);
                        }}
                        className="absolute bottom-3 left-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 transition-all text-white text-sm font-medium group/ptr"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Watch Trailer
                      </button>
                    )}

                    {/* Type badge top-right */}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-sm">
                        {isTv ? 'TV Series' : 'Movie'}
                      </span>
                    </div>

                    {/* Loading overlay */}
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#18181b]/60">
                        <Loader2 className="w-6 h-6 text-white/70 animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-neutral-800 flex items-center justify-center">
                    {loading ? (
                      <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                    ) : (
                      <span className="text-white/30 text-sm">No preview</span>
                    )}
                  </div>
                )}

                {/* Info section */}
                <div className="p-4 space-y-3">
                  {/* Title + actions */}
                  <div className="flex items-start gap-3">
                    <h3 className="text-[15px] font-bold text-white leading-tight line-clamp-2 flex-1">
                      {title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {data?.trailer_key && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrailerKey(data.trailer_key);
                          }}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                          title="Play Trailer"
                        >
                          <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClick();
                        }}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        title="More Info"
                      >
                        <ChevronDown className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {rating && parseFloat(rating) > 0 && (
                      <span className="flex items-center gap-1 text-green-400 font-semibold">
                        {parseFloat(rating) * 10}% Match
                      </span>
                    )}
                    {year && (
                      <span className="text-white/50 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {year}
                      </span>
                    )}
                    {data?.runtime && (
                      <span className="text-white/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {data.runtime}m
                      </span>
                    )}
                    {data?.number_of_seasons && (
                      <span className="px-1.5 py-0.5 rounded border border-white/20 text-white/50 text-[10px]">
                        {data.number_of_seasons} Season{data.number_of_seasons > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-white/30">HD</span>
                  </div>

                  {/* Genres */}
                  {genres.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {genres.slice(0, 3).map((g) => (
                        <span
                          key={g.id}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/8 text-white/60"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Overview */}
                  <p className="text-[13px] text-white/50 leading-relaxed line-clamp-3">
                    {data?.overview || movie.overview}
                  </p>

                  {/* Cast */}
                  {cast.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-white/40 shrink-0">Cast:</span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {cast.slice(0, 4).map((c) => (
                          <span key={c.name} className="text-[11px] text-white/60 whitespace-nowrap">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        trailerKey={trailerKey}
        title={title}
        onClose={() => setTrailerKey(null)}
      />
    </>
  );
}

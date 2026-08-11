'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import type { Movie } from '@/lib/types';

interface TrendingRankedProps {
  movies: Movie[];
}

export function TrendingRanked({ movies }: TrendingRankedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const { selectMovie, selectTv } = useAppStore();

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (!movies.length) return null;

  return (
    <section className="relative mb-8 md:mb-10">
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-red-500">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
          Trending Right Now
        </h2>
        <div className="flex items-center gap-1">
          {showLeft && (
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {showRight && (
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 md:gap-4 overflow-x-auto content-scroll px-4 md:px-8 pb-4"
      >
        {movies.map((movie, i) => {
          const rank = i + 1;
          const isTv = movie.media_type === 'tv' || !!movie.first_air_date;
          const title = movie.title || movie.name || 'Unknown';
          const year = (movie.release_date || movie.first_air_date || '').split('-')[0];
          const rating = movie.vote_average?.toFixed(1);

          const handleClick = () => {
            if (isTv) {
              selectTv({ ...movie, name: movie.name || title });
            } else {
              selectMovie(movie);
            }
          };

          return (
            <motion.button
              key={`${movie.id}-${movie.media_type}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={handleClick}
              className="relative flex-shrink-0 w-[130px] sm:w-[150px] md:w-[170px] text-left group cursor-pointer"
            >
              <div className="relative">
                <span
                  className="absolute -left-1 -bottom-2 text-[6rem] sm:text-[7rem] md:text-[8rem] font-black leading-none select-none pointer-events-none"
                  style={{
                    WebkitTextStroke: '1px rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.03)',
                    fontFamily: 'system-ui, sans-serif',
                    zIndex: 0,
                  }}
                  aria-hidden="true"
                >
                  {rank}
                </span>

                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 shadow-lg shadow-black/50" style={{ zIndex: 1 }}>
                  <img
                    src={getImageUrl(movie.poster_path, 'w342')}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-sm">
                      {isTv ? 'TV' : 'Movie'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 px-0.5 relative" style={{ zIndex: 1 }}>
                <p className="text-xs font-semibold text-white truncate leading-snug">{title}</p>
                <p className="text-[11px] text-white/50 mt-0.5 flex items-center gap-1.5">
                  {year && <span>{year}</span>}
                  {year && rating && <span className="text-white/20">·</span>}
                  {rating && parseFloat(rating) > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {rating}
                    </span>
                  )}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

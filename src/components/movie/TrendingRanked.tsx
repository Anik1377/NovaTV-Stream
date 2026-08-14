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
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (!movies.length) return null;

  // Netflix-style: show top 10 with numbered cards
  const top10 = movies.slice(0, 10);

  return (
    <section className="relative mb-8 md:mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            <span className="text-2xl md:text-3xl font-black text-red-500 tracking-tighter leading-none">TOP</span>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none"> 10</span>
          </div>
          <span className="text-sm md:text-base text-white/50 font-medium">in Streaming Today</span>
        </div>
        <div className="flex items-center gap-1">
          {showLeft && (
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {showRight && (
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Netflix-style horizontal cards */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 md:gap-4 overflow-x-auto content-scroll px-4 md:px-8 pb-4"
      >
        {top10.map((movie, i) => {
          const rank = i + 1;
          const isTv = movie.media_type === 'tv' || !!movie.first_air_date;
          const title = movie.title || movie.name || 'Unknown';
          const year = (movie.release_date || movie.first_air_date || '').split('-')[0];
          const rating = movie.vote_average?.toFixed(1);
          const hasBackdrop = !!movie.backdrop_path;
          const imgSrc = hasBackdrop
            ? getImageUrl(movie.backdrop_path, 'w780')
            : getImageUrl(movie.poster_path, 'w500');

          const handleClick = () => {
            if (isTv) {
              selectTv({ ...movie, name: movie.name || title });
            } else {
              selectMovie(movie);
            }
          };

          return (
            <motion.button
              key={`${movie.id}-${movie.media_type}-${i}`}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
              onClick={handleClick}
              className="relative flex-shrink-0 text-left group cursor-pointer outline-none"
              style={{ width: 'calc(50vw - 2rem)', maxWidth: '320px' }}
            >
              {/* Card container */}
              <div className="relative flex items-stretch gap-0 overflow-hidden rounded-lg bg-neutral-900/80 shadow-xl shadow-black/40">
                {/* Number — Netflix style overlapping left edge */}
                <div className="relative z-10 flex items-center justify-center shrink-0 pl-2 pr-0">
                  <span
                    className="font-black leading-none select-none pointer-events-none"
                    style={{
                      fontSize: 'clamp(4rem, 12vw, 8rem)',
                      color: 'transparent',
                      WebkitTextStroke: '3px rgba(229, 9, 20, 0.7)',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      textShadow: '0 0 40px rgba(229, 9, 20, 0.15)',
                    }}
                    aria-hidden="true"
                  >
                    {rank}
                  </span>
                </div>

                {/* Image area */}
                <div className={hasBackdrop ? 'flex-1 aspect-video min-w-0' : 'w-24 aspect-[2/3] shrink-0'}>
                  <div className="relative w-full h-full overflow-hidden rounded-r-lg">
                    <img
                      src={imgSrc}
                      alt={title}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!hasBackdrop ? 'object-center' : ''}`}
                      loading={i < 3 ? 'eager' : 'lazy'}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-red-600/30">
                        <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-sm border border-white/10">
                        {isTv ? 'TV Series' : 'Movie'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info below card */}
              <div className="mt-3 pl-10">
                <h3 className="text-sm font-bold text-white truncate leading-snug group-hover:text-red-400 transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-white/45 mt-1 flex items-center gap-1.5">
                  {year && <span>{year}</span>}
                  {year && rating && parseFloat(rating) > 0 && <span className="text-white/15">·</span>}
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

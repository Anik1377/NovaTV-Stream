'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Movie } from '@/lib/types';
import { useAppStore } from '@/store/app-store';
import { MovieCard } from './MovieCard';

interface ContentRowProps {
  title: string;
  movies: Movie[];
  accentColor?: 'red' | 'purple';
  icon?: ReactNode;
  /** Genre ID for "View More" navigation (null for preset sorts like popular/top-rated) */
  genreId?: number | null;
  /** Media type filter for "View More" */
  mediaType?: 'movie' | 'tv' | 'all';
  /** Sort override for "View More" (e.g. 'popularity.desc', 'vote_average.desc') */
  sortBy?: string;
  /** Region override for "View More" (e.g. 'IN') */
  region?: string;
}

export function ContentRow({ title, movies, accentColor = 'red', icon, genreId, mediaType = 'all', sortBy, region }: ContentRowProps) {
  const isPurple = accentColor === 'purple';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const selectCategory = useAppStore(s => s.selectCategory);

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

  const handleViewMore = () => {
    if (genreId !== undefined) {
      selectCategory(genreId, title, mediaType, sortBy, region);
    }
  };

  return (
    <section className="relative mb-8 md:mb-10">
      <div className="flex items-center justify-between mb-3 md:mb-4 px-4 md:px-8">
        <h2 className={`text-lg md:text-xl font-bold flex items-center gap-2 ${isPurple ? 'text-purple-100' : 'text-white'}`}>
          {icon && <span className={isPurple ? 'text-purple-400' : 'text-red-500'}>{icon}</span>}
          {title}
        </h2>
        {genreId !== undefined && (
          <button
            onClick={handleViewMore}
            className={`flex items-center gap-1 text-xs font-semibold tracking-wide uppercase transition-colors ${
              isPurple
                ? 'text-purple-400 hover:text-purple-300'
                : 'text-red-500 hover:text-red-400'
            }`}
          >
            View More
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="group/row relative">
        {/* Left Arrow */}
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-8 z-10 w-12 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 md:gap-3 overflow-x-auto content-scroll px-4 md:px-8 pb-2"
        >
          {movies.map((movie, i) => (
            <MovieCard key={`${movie.id}-${movie.media_type}`} movie={movie} index={i} accentColor={accentColor} />
          ))}
        </div>

        {/* Right Arrow */}
        {showRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-8 z-10 w-12 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
      </div>
    </section>
  );
}

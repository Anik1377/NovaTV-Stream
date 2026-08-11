'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie } from '@/lib/types';
import { MovieCard } from './MovieCard';

interface ContentRowProps {
  title: string;
  movies: Movie[];
  accentColor?: 'red' | 'purple';
}

export function ContentRow({ title, movies, accentColor = 'red' }: ContentRowProps) {
  const isPurple = accentColor === 'purple';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

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
      <h2 className={`text-lg md:text-xl font-bold mb-3 md:mb-4 px-4 md:px-8 ${isPurple ? 'text-purple-100' : 'text-white'}`}>
        {title}
      </h2>
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
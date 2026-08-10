'use client';

import { useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie } from '@/lib/types';
import { MovieCard } from './MovieCard';

interface ContentRowProps {
  title: string;
  movies: Movie[];
}

export function ContentRow({ title, movies }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [hovered, setHovered] = useState(false);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

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
    <section className="relative mb-10 md:mb-14">
      <div className="flex items-center justify-between mb-4 md:mb-5 px-6 md:px-12 lg:px-16">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <span className="w-1 h-7 bg-[#e50914] rounded-full" />
          {title}
        </h2>
      </div>

      <div
        className="group/row relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className={
            'absolute left-0 top-0 bottom-0 z-10 w-16 md:w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none transition-opacity duration-300 ' +
            (showLeft && hovered ? 'opacity-100' : 'opacity-0')
          }
        />
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className={
              'absolute left-0 top-0 bottom-0 z-20 w-14 md:w-16 flex items-center justify-center transition-opacity duration-300 ' +
              (hovered ? 'opacity-100' : 'opacity-0')
            }
            aria-label="Scroll left"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto content-scroll no-scrollbar px-6 md:px-12 lg:px-16 pb-2"
        >
          {movies.map((movie, i) => (
            <MovieCard key={`${movie.id}-${movie.media_type}`} movie={movie} index={i} />
          ))}
        </div>

        <div
          className={
            'absolute right-0 top-0 bottom-0 z-10 w-16 md:w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none transition-opacity duration-300 ' +
            (showRight && hovered ? 'opacity-100' : 'opacity-0')
          }
        />
        {showRight && (
          <button
            onClick={() => scroll('right')}
            className={
              'absolute right-0 top-0 bottom-0 z-20 w-14 md:w-16 flex items-center justify-center transition-opacity duration-300 ' +
              (hovered ? 'opacity-100' : 'opacity-0')
            }
            aria-label="Scroll right"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>
        )}
      </div>
    </section>
  );
}

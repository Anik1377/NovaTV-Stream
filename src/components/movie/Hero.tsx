'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBackdropUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import type { Movie } from '@/lib/types';

export function Hero({ movies }: { movies: Movie[] }) {
  const { selectMovie, selectTv } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const moviesRef = useRef(movies);
  moviesRef.current = movies;

  const goTo = useCallback((index: number) => {
    setCurrentIndex((prev) => {
      setDirection(index > prev ? 1 : -1);
      return index;
    });
  }, []);

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % moviesRef.current.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + moviesRef.current.length) % moviesRef.current.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  const movie = movies[currentIndex];
  if (!movie) return null;

  const isTv = movie.media_type === 'tv' || !!movie.first_air_date;
  const title = movie.title || movie.name || '';
  const year = (movie.release_date || movie.first_air_date || '').split('-')[0];
  const rating = movie.vote_average?.toFixed(1);

  const handlePlay = () => {
    if (isTv) {
      selectTv({ ...movie, name: movie.name || title });
    } else {
      selectMovie(movie);
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="relative w-full h-[60vh] md:h-[75vh] lg:h-[85vh] overflow-hidden">
      {/* Background images */}
      <AnimatePresence custom={direction} mode="popLayout">
        <motion.div
          key={movie.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {movie.backdrop_path && (
            <img src={getBackdropUrl(movie.backdrop_path)} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-end md:items-center pb-16 md:pb-0">
        <div className="px-4 md:px-8 lg:px-12 max-w-2xl">
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={movie.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-sm bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                  {isTv ? 'TV Series' : 'Movie'}
                </span>
                {rating && parseFloat(rating) > 0 && (
                  <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    {rating}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-3 drop-shadow-2xl">
                {title}
              </h1>

              <div className="flex items-center gap-3 text-white/70 text-sm mb-4">
                {year && <span>{year}</span>}
                {isTv && movie.number_of_seasons && (
                  <span>{movie.number_of_seasons} Season{movie.number_of_seasons > 1 ? 's' : ''}</span>
                )}
                {!isTv && movie.original_language && (
                  <span className="uppercase">{movie.original_language}</span>
                )}
              </div>

              <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6 line-clamp-3 md:line-clamp-4">
                {movie.overview}
              </p>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePlay}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 md:px-8 h-11 md:h-12 text-base gap-2 rounded-lg"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Watch Now
                </Button>
                <Button
                  onClick={handlePlay}
                  variant="secondary"
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border-white/20 px-6 md:px-8 h-11 md:h-12 text-base gap-2 rounded-lg"
                >
                  <Info className="w-5 h-5" />
                  More Info
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation dots & arrows */}
      {movies.length > 1 && (
        <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 flex items-center gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1.5">
            {movies.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-6 bg-red-500' : 'w-3 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

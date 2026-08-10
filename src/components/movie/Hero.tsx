'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBackdropUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import type { Movie } from '@/lib/types';

export function Hero({ movies }: { movies: Movie[] }) {
  const { selectMovie, selectTv } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const moviesRef = useRef(movies);

  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % moviesRef.current.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 10000);
    return () => clearInterval(timer);
  }, [next]);

  const movie = movies[currentIndex];
  if (!movie) return null;

  const isTv = movie.media_type === 'tv' || !!movie.first_air_date;
  const title = movie.title || movie.name || '';
  const tagline = (movie as any).tagline || '';
  const year = (movie.release_date || movie.first_air_date || '').split('-')[0];
  const rating = movie.vote_average?.toFixed(1);
  const runtime = (movie as any).runtime;

  const handlePlay = () => {
    if (isTv) {
      selectTv({ ...movie, name: movie.name || title });
    } else {
      selectMovie(movie);
    }
  };

  const handleInfo = () => {
    if (isTv) {
      selectTv({ ...movie, name: movie.name || title });
    } else {
      selectMovie(movie);
    }
  };

  const formatRuntime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="relative w-full h-[70vh] md:h-screen overflow-hidden">
      {/* Background images with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${movie.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 pointer-events-none"
        >
          {movie.backdrop_path && (
            <img
              src={getBackdropUrl(movie.backdrop_path)}
              alt=""
              className="w-full h-full object-cover scale-105"
            />
          )}
          {/* Bottom-left gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          {/* Bottom gradient to background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
          {/* Subtle top vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="px-6 md:px-12 lg:px-16 max-w-2xl pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${movie.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            >
              {/* Type badge + HD */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-md bg-[#e50914] text-white text-xs font-bold uppercase tracking-widest">
                  {isTv ? 'TV Series' : 'Movie'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/10">
                  HD
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-3 tracking-tight">
                {title}
              </h1>

              {/* Tagline */}
              {tagline && (
                <p className="text-white/50 italic text-base md:text-lg mb-4 font-light">
                  &ldquo;{tagline}&rdquo;
                </p>
              )}

              {/* Metadata row */}
              <div className="flex items-center gap-2.5 text-sm text-white/70 mb-5">
                {year && <span className="font-medium text-white/80">{year}</span>}
                {year && ((isTv && (movie as any).number_of_seasons) || (!isTv && runtime)) && (
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                )}
                {isTv && (movie as any).number_of_seasons && (
                  <span>{(movie as any).number_of_seasons} Season{(movie as any).number_of_seasons > 1 ? 's' : ''}</span>
                )}
                {!isTv && runtime && runtime > 0 && (
                  <span>{formatRuntime(runtime)}</span>
                )}
                {rating && parseFloat(rating) > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {rating}
                    </span>
                  </>
                )}
              </div>

              {/* Overview */}
              <p className="text-white/60 text-sm md:text-base leading-relaxed mb-7 line-clamp-2 md:line-clamp-3 max-w-lg">
                {movie.overview}
              </p>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePlay}
                  className="bg-[#e50914] hover:bg-[#dc2626] text-white px-7 md:px-8 h-12 md:h-13 text-[15px] font-semibold gap-2.5 rounded-xl shadow-lg shadow-[#e50914]/25 hover:shadow-xl hover:shadow-[#e50914]/30"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Play Now
                </Button>
                <Button
                  onClick={handleInfo}
                  className="bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.12] hover:border-white/20 px-7 md:px-8 h-12 md:h-13 text-[15px] font-semibold gap-2.5 rounded-xl backdrop-blur-sm"
                >
                  <Info className="w-5 h-5" />
                  More Info
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation dots */}
      {movies.length > 1 && (
        <div className="absolute bottom-8 right-6 md:right-12 lg:right-16 flex items-center gap-2 pointer-events-auto">
          {movies.slice(0, 8).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-500 ${
                i === currentIndex
                  ? 'w-8 h-2 bg-[#e50914]'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

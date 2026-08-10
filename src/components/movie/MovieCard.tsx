'use client';

import { useState } from 'react';
import { Play, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import type { Movie } from '@/lib/types';

interface MovieCardProps {
  movie: Movie;
  index?: number;
  wide?: boolean;
}

export function MovieCard({ movie, index = 0, wide = false }: MovieCardProps) {
  const { selectMovie, selectTv } = useAppStore();
  const [imgLoaded, setImgLoaded] = useState(false);
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

  const w = wide ? 'w-[150px] sm:w-[175px] md:w-[200px]' : 'w-[150px] sm:w-[175px] md:w-[200px]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: 'easeOut' }}
      className={`group relative flex-shrink-0 ${w} cursor-pointer`}
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/[0.05] group-hover:border-white/[0.12] transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-black/50">
        {/* Skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-[#141414] animate-pulse" />
        )}

        {/* Image */}
        <img
          src={getImageUrl(movie.poster_path, 'w342')}
          alt={title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="%23141414"><rect width="300" height="450"/><text x="150" y="225" fill="%23333" text-anchor="middle" font-size="14">No Image</text></svg>'
            );
            setImgLoaded(true);
          }}
        />

        {/* Type badge - top left */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2 py-[3px] rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#e50914]/90 text-white backdrop-blur-sm">
            {isTv ? 'TV' : 'Movie'}
          </span>
        </div>

        {/* Rating pill - top right */}
        {rating && parseFloat(rating) > 0 && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="flex items-center gap-1 px-2 py-[3px] rounded-md text-[10px] font-semibold bg-black/60 text-amber-400 backdrop-blur-sm border border-white/[0.08]">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              {rating}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end pointer-events-none">
          {/* Play icon centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#e50914]/90 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-black/40 scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
          {/* Bottom text info */}
          <div className="p-3 pt-8">
            <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 mb-1">{title}</h3>
            <div className="flex items-center gap-2">
              {year && <span className="text-white/50 text-xs">{year}</span>}
              {rating && parseFloat(rating) > 0 && (
                <span className="flex items-center gap-0.5 text-amber-400 text-xs">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  {rating}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

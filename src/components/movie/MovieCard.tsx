'use client';

import { useState } from 'react';
import { Play, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import type { Movie } from '@/lib/types';
import { HoverPreviewCard } from './HoverPreviewCard';

interface MovieCardProps {
  movie: Movie;
  index?: number;
  accentColor?: 'red' | 'purple';
}

export function MovieCard({ movie, index = 0, accentColor = 'red' }: MovieCardProps) {
  const isPurple = accentColor === 'purple';
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

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={getImageUrl(movie.poster_path, 'w342')}
          alt={title}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="%23222"><rect width="300" height="450"/><text x="150" y="225" fill="%23555" text-anchor="middle" font-size="14">No Image</text></svg>'
            );
            setImgLoaded(true);
          }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="flex items-center gap-2 mb-1">
            {rating && parseFloat(rating) > 0 && (
              <span className="flex items-center gap-1 text-yellow-400 text-xs font-medium">
                <Star className="w-3 h-3 fill-yellow-400" />
                {rating}
              </span>
            )}
            {year && <span className="text-white/60 text-xs">{year}</span>}
          </div>
          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">{title}</h3>
        </div>
        {/* Play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={`w-12 h-12 rounded-full ${isPurple ? 'bg-purple-600/90' : 'bg-red-600/90'} flex items-center justify-center backdrop-blur-sm`}>            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isPurple ? 'bg-purple-600/90' : 'bg-red-600/90'} text-white backdrop-blur-sm`}>
            {isTv ? 'TV' : 'Movie'}
          </span>
        </div>
      </div>
      <div className="mt-2 px-1">
        <p className="text-xs text-white/90 font-medium truncate">{title}</p>
        <p className="text-[10px] text-white/50 mt-0.5">{year}</p>
      </div>
    </motion.div>
  );

  return (
    <HoverPreviewCard movie={movie}>
      {card}
    </HoverPreviewCard>
  );
}

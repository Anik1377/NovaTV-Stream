'use client';

import { useState, useEffect } from 'react';
import { Play, Tv, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import { getWatchHistory, removeWatchHistory, type WatchHistoryEntry } from '@/lib/watch-history';

export function ContinueWatching() {
  const [items, setItems] = useState<WatchHistoryEntry[]>([]);
  const selectMovie = useAppStore(s => s.selectMovie);
  const selectTv = useAppStore(s => s.selectTv);

  // Read from localStorage on mount and when view changes to home
  useEffect(() => {
    setItems(getWatchHistory());
  }, []);

  // Listen for storage events (cross-tab sync) and custom refresh events
  useEffect(() => {
    const refresh = () => setItems(getWatchHistory());
    window.addEventListener('storage', refresh);
    window.addEventListener('watch-history-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('watch-history-updated', refresh);
    };
  }, []);

  if (items.length === 0) return null;

  const handleClick = (item: WatchHistoryEntry) => {
    const media = {
      id: item.tmdbId,
      title: item.title,
      name: item.title,
      poster_path: item.posterPath,
      backdrop_path: item.backdropPath,
      media_type: item.mediaType,
      vote_average: 0,
      genre_ids: [],
      overview: '',
      popularity: 0,
      release_date: '',
      first_air_date: '',
      original_language: '',
    };
    if (item.mediaType === 'tv') selectTv(media);
    else selectMovie(media);
  };

  const handleRemove = (e: React.MouseEvent, item: WatchHistoryEntry) => {
    e.stopPropagation();
    removeWatchHistory(item.tmdbId, item.mediaType);
    setItems(getWatchHistory());
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4 px-4 md:px-8">
        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
          <Clock className="w-4 h-4 text-white/70" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Continue Watching</h2>
        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 text-xs font-medium">{items.length}</span>
      </div>

      <div className="relative">
        <div className="flex gap-3 md:gap-4 overflow-x-auto content-scroll no-scrollbar px-4 md:px-8 pb-4">
          {items.slice(0, 20).map((item, i) => {
            const imgUrl = item.posterPath ? getImageUrl(item.posterPath, 'w342') : null;
            const subtitle = item.mediaType === 'tv' && item.season && item.episode
              ? `S${String(item.season).padStart(2, '0')}E${String(item.episode).padStart(2, '0')}`
              : item.mediaType === 'tv' ? 'TV Series'
              : 'Movie';

            return (
              <motion.div
                key={`${item.tmdbId}-${item.mediaType}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.3 }}
                className="group relative flex-shrink-0 w-[150px] sm:w-[170px] md:w-[190px] cursor-pointer"
                onClick={() => handleClick(item)}
              >
                {/* Card */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                      {item.mediaType === 'tv' ? <Tv className="w-8 h-8 text-white/10" /> : <Play className="w-8 h-8 text-white/10" />}
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-semibold line-clamp-1 leading-tight">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/60 text-[10px] font-medium">{subtitle}</span>
                      {item.episodeName && (
                        <span className="text-white/40 text-[10px] truncate">{item.episodeName}</span>
                      )}
                    </div>
                    <p className="text-white/30 text-[10px] mt-1">{formatTimeAgo(item.watchedAt)}</p>
                  </div>

                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e50914]/90 text-white backdrop-blur-sm">
                      {item.mediaType === 'tv' ? 'TV' : 'Movie'}
                    </span>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(e, item)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove from history"
                  >
                    <X className="w-3.5 h-3.5 text-white/70" />
                  </button>

                  {/* Progress bar (visual indicator that it was watched) */}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                    <div className="h-full bg-[#e50914] w-full" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

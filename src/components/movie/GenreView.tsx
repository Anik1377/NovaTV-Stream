'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Film, Tv } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { MovieCard } from './MovieCard';
import type { Movie, PaginatedResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function GenreView() {
  const { selectedGenreId, selectedGenreName, goHome } = useAppStore();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    if (!selectedGenreId) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
    });
    Promise.all([
      fetch(`/api/tmdb/popular-movies?page=1`).then(r => r.json()).catch(() => ({ results: [] })),
      fetch(`/api/tmdb/popular-tv?page=1`).then(r => r.json()).catch(() => ({ results: [] })),
    ]).then(([movieData, tvData]) => {
      if (cancelled) return;
      const filteredMovies = movieData.results?.filter((m: Movie) => m.genre_ids?.includes(selectedGenreId!)) || [];
      const filteredTv = tvData.results?.filter((m: Movie) => m.genre_ids?.includes(selectedGenreId!)) || [];
      setMovies(filteredMovies);
      setTvShows(filteredTv);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedGenreId]);

  const displayItems = tab === 'movie' ? movies : tab === 'tv' ? tvShows : [...movies, ...tvShows];

  return (
    <div className="pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto mb-8">
        <button onClick={goHome} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{selectedGenreName}</h1>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-2">
        {(['all', 'movie', 'tv'] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'default' : 'secondary'}
            onClick={() => setTab(t)}
            className={tab === t ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/10 hover:bg-white/15 text-white/80'}
          >
            {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-20 text-white/50">
          <p className="text-lg">No content found for this genre</p>
          <Button onClick={goHome} variant="secondary" className="mt-4 bg-white/10 hover:bg-white/15 text-white">
            Browse Home
          </Button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
          {displayItems.map((m, i) => (
            <MovieCard key={`${m.id}-${m.media_type}-${i}`} movie={m} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
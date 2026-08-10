'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { MovieCard } from './MovieCard';
import type { Movie } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function GenreView() {
  const { selectedGenreId, selectedGenreName, goHome } = useAppStore();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    if (!selectedGenreId) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="pt-24 pb-10 px-6 md:px-12 lg:px-16">
      {/* Back button */}
      <button
        onClick={goHome}
        className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors duration-300 group"
      >
        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <h1 className="text-2xl md:text-4xl font-bold text-white mb-6 tracking-tight">{selectedGenreName}</h1>

      {/* Pill/segment control tabs */}
      <div className="flex items-center bg-white/[0.04] rounded-full p-1 w-fit mb-8 border border-white/[0.06]">
        {(['all', 'movie', 'tv'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              tab === t
                ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/20'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#e50914] animate-spin" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-9 h-9 text-white/10" />
          </div>
          <p className="text-white/50 text-lg font-medium mb-2">No content found</p>
          <p className="text-white/30 text-sm mb-6">No movies or TV shows available in this genre yet.</p>
          <Button onClick={goHome} className="bg-white/[0.08] hover:bg-white/15 text-white border border-white/[0.08] rounded-xl">
            Browse Home
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {displayItems.map((m, i) => (
            <MovieCard key={`${m.id}-${m.media_type}`} movie={m} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

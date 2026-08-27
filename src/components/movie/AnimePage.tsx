'use client';

import { Sparkles, TrendingUp } from 'lucide-react';
import { ContentRow } from './ContentRow';
import { useState, useEffect, useCallback } from 'react';
import type { Movie } from '@/lib/types';

export function AnimePage() {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnime = useCallback(async () => {
    try {
      const withGenre = (genreId: number) => `with_genres=${genreId}&with_original_language=ja&sort_by=popularity.desc`;
      const [trendingRes, popularRes, topRatedRes] = await Promise.all([
        fetch('/api/tmdb/trending?time_window=week').then(r => r.json()),
        fetch(`/api/tmdb/popular-movies?${withGenre(16)}`).then(r => r.json()),
        fetch(`/api/tmdb/top-rated?${withGenre(16)}`).then(r => r.json()),
      ]);
      const filterAnime = (results: Movie[]) =>
        results.filter((m: Movie) =>
          m.genre_ids?.includes(16) || m.original_language === 'ja' || m.original_language === 'ko'
        );
      setTrending(filterAnime(trendingRes.results || []).slice(0, 20));
      setPopular((popularRes.results || []).slice(0, 20));
      setTopRated((topRatedRes.results || []).slice(0, 20));
    } catch (error) {
      console.error('Failed to fetch anime:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnime(); }, [fetchAnime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 md:px-8 pt-20 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Anime</h1>
            <p className="text-sm text-white/50">Discover trending anime & more</p>
          </div>
        </div>
      </div>
      <ContentRow title="🔥 Trending Anime" movies={trending} />
      <ContentRow title="📈 Popular Anime" movies={popular} />
      <ContentRow title="⭐ Top Rated Anime" movies={topRated} />
      {trending.length === 0 && popular.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Sparkles className="w-16 h-16 text-white/10 mb-4" />
          <h3 className="text-lg font-semibold text-white/60">No anime found</h3>
          <p className="text-sm text-white/30 mt-1">Check back later for updates</p>
        </div>
      )}
    </div>
  );
}
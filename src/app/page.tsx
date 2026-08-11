'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Clapperboard, TrendingUp, Film, Star, Clock, Tv } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Header } from '@/components/movie/Header';
import { Hero } from '@/components/movie/Hero';
import { ContentRow } from '@/components/movie/ContentRow';
import { MovieDetail } from '@/components/movie/MovieDetail';
import { TvDetail } from '@/components/movie/TvDetail';
import { SearchResults } from '@/components/movie/SearchResults';
import { GenreView } from '@/components/movie/GenreView';
import { LiveTV } from '@/components/live-tv/LiveTV';
import { AnimePage } from '@/components/anime/AnimePage';
import { GamesPage } from '@/components/game/GamesPage';
import type { Movie, Genre } from '@/lib/types';

function HomePage() {
  const { selectGenre, mediaFilter } = useAppStore();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTv, setPopularTv] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [topRatedTv, setTopRatedTv] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [trendingRes, moviesRes, tvRes, topRatedRes, upcomingRes, topRatedTvRes, genresRes] = await Promise.all([
        fetch('/api/tmdb/trending?time_window=week').then((r) => r.json()),
        fetch('/api/tmdb/popular-movies').then((r) => r.json()),
        fetch('/api/tmdb/popular-tv').then((r) => r.json()),
        fetch('/api/tmdb/top-rated').then((r) => r.json()),
        fetch('/api/tmdb/upcoming').then((r) => r.json()),
        fetch('/api/tmdb/top-rated-tv').then((r) => r.json()),
        fetch('/api/tmdb/genres').then((r) => r.json()),
      ]);

      setTrending((trendingRes.results || []).slice(0, 20));
      setPopularMovies((moviesRes.results || []).slice(0, 20));
      setPopularTv((tvRes.results || []).map((t: Movie) => ({ ...t, media_type: 'tv' as const })).slice(0, 20));
      setTopRated((topRatedRes.results || []).slice(0, 20));
      setUpcoming((upcomingRes.results || []).slice(0, 20));
      setTopRatedTv((topRatedTvRes.results || []).map((t: Movie) => ({ ...t, media_type: 'tv' as const })).slice(0, 20));
      setGenres(genresRes.genres || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTrending = mediaFilter === 'movie'
    ? trending.filter(m => m.media_type === 'movie')
    : mediaFilter === 'tv'
    ? trending.filter(m => m.media_type === 'tv')
    : trending;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading StreamVault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {mediaFilter === 'all' && <Hero movies={trending.slice(0, 8)} />}
      {mediaFilter === 'movie' && filteredTrending.length > 0 && <Hero movies={filteredTrending.slice(0, 8)} />}
      {mediaFilter === 'tv' && filteredTrending.length > 0 && <Hero movies={filteredTrending.slice(0, 8)} />}

      {genres.length > 0 && (
        <div className={"px-4 md:px-8 relative z-10 mb-6 " + (mediaFilter === 'all' ? '-mt-4' : 'mt-20')}>
          <div className="flex gap-2 overflow-x-auto content-scroll pb-2">
            {genres.slice(0, 15).map((genre) => (
              <button
                key={genre.id}
                onClick={() => selectGenre(genre.id, genre.name)}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors border border-white/5 hover:border-white/15"
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {mediaFilter !== 'tv' && (
        <div>
          <ContentRow title="Trending This Week" movies={mediaFilter === 'all' ? trending : filteredTrending} icon={<TrendingUp className="w-5 h-5" />} />
          <ContentRow title="Popular Movies" movies={popularMovies} icon={<Film className="w-5 h-5" />} />
          <ContentRow title="Top Rated Movies" movies={topRated} icon={<Star className="w-5 h-5" />} />
          {upcoming.length > 0 && <ContentRow title="Coming Soon" movies={upcoming} icon={<Clock className="w-5 h-5" />} />}
        </div>
      )}

      {mediaFilter !== 'movie' && (
        <div>
          <ContentRow title="Popular TV Shows" movies={popularTv} icon={<Tv className="w-5 h-5" />} />
          <ContentRow title="Top Rated TV Shows" movies={topRatedTv} icon={<Star className="w-5 h-5" />} />
        </div>
      )}

      <footer className="mt-16 border-t border-white/10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center">
              <Clapperboard className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold">
              Stream<span className="text-red-500">Vault</span>
            </span>
          </div>
          <p className="text-white/40 text-xs text-center">
            StreamVault does not store any files on its server. All contents are provided by non-affiliated third parties.
          </p>
          <div className="flex items-center gap-4 text-white/40 text-xs">
            <span>Powered by TMDB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const { view } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {view === 'home' && <HomePage />}
        {view === 'movie' && <MovieDetail />}
        {view === 'tv' && <TvDetail />}
        {view === 'search' && <SearchResults />}
        {view === 'genre' && <GenreView />}
        {view === 'livetv' && <LiveTV />}
        {view === 'anime' && <AnimePage />}
        {view === 'games' && <GamesPage />}
      </main>
    </div>
  );
}

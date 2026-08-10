'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Clapperboard, Github, Twitter, Youtube, Mail } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Header } from '@/components/movie/Header';
import { Hero } from '@/components/movie/Hero';
import { ContentRow } from '@/components/movie/ContentRow';
import { MovieDetail } from '@/components/movie/MovieDetail';
import { TvDetail } from '@/components/movie/TvDetail';
import { SearchResults } from '@/components/movie/SearchResults';
import { GenreView } from '@/components/movie/GenreView';
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
          <div className="w-14 h-14 bg-[#e50914]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-7 h-7 text-[#e50914] animate-spin" />
          </div>
          <p className="text-white/40 text-sm font-medium">Loading StreamVault...</p>
        </div>
      </div>
    );
  }

  const heroMovies = (mediaFilter === 'all' ? trending : filteredTrending).slice(0, 8);

  return (
    <div>
      {/* Hero */}
      {heroMovies.length > 0 && <Hero movies={heroMovies} />}

      {/* Genre pills */}
      {genres.length > 0 && (
        <div className={`px-6 md:px-12 lg:px-16 relative z-10 mb-10 md:mb-14 ${heroMovies.length > 0 ? '-mt-6' : 'mt-24'}`}>
          <div className="flex gap-2 overflow-x-auto content-scroll no-scrollbar pb-1">
            {genres.slice(0, 15).map((genre) => (
              <button
                key={genre.id}
                onClick={() => selectGenre(genre.id, genre.name)}
                className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white border border-white/[0.06] hover:border-white/12 transition-all duration-300"
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content rows */}
      <div className="px-0">
        {mediaFilter !== 'tv' && (
          <>
            <ContentRow title="Trending This Week" movies={mediaFilter === 'all' ? trending : filteredTrending} />
            <ContentRow title="Popular Movies" movies={popularMovies} />
            <ContentRow title="Top Rated Movies" movies={topRated} />
            {upcoming.length > 0 && <ContentRow title="Coming Soon" movies={upcoming} />}
          </>
        )}

        {mediaFilter !== 'movie' && (
          <>
            <ContentRow title="Popular TV Shows" movies={popularTv} />
            <ContentRow title="Top Rated TV Shows" movies={topRatedTv} />
          </>
        )}
      </div>

      {/* Multi-column footer */}
      <footer className="mt-16 md:mt-24 border-t border-white/[0.06]">
        <div className="px-6 md:px-12 lg:px-16 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
              {/* About column */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 bg-[#e50914] rounded-lg flex items-center justify-center">
                    <Clapperboard className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold tracking-tight">
                    Stream<span className="text-[#e50914]">Vault</span>
                  </span>
                </div>
                <p className="text-white/30 text-sm leading-relaxed max-w-xs">
                  Your premium destination for movies and TV shows. Discover, explore, and watch the best content from around the world.
                </p>
                {/* Social icons */}
                <div className="flex items-center gap-2 mt-5">
                  <a href="#" className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    <Youtube className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Browse column */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Browse</h4>
                <ul className="space-y-2.5">
                  {['Movies', 'TV Shows', 'Trending', 'Top Rated', 'Coming Soon'].map((item) => (
                    <li key={item}>
                      <span className="text-white/30 text-sm hover:text-white/60 cursor-pointer transition-colors duration-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Genres column */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Genres</h4>
                <ul className="space-y-2.5">
                  {['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Thriller'].map((item) => (
                    <li key={item}>
                      <span className="text-white/30 text-sm hover:text-white/60 cursor-pointer transition-colors duration-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal column */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Legal</h4>
                <ul className="space-y-2.5">
                  {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'DMCA', 'Contact Us'].map((item) => (
                    <li key={item}>
                      <span className="text-white/30 text-sm hover:text-white/60 cursor-pointer transition-colors duration-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-white/20 text-xs text-center md:text-left">
                &copy; {new Date().getFullYear()} StreamVault. All rights reserved.
              </p>
              <p className="text-white/15 text-xs text-center md:text-right max-w-md">
                StreamVault does not store any files on its server. All contents are provided by non-affiliated third parties. Powered by TMDB.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const { view } = useAppStore();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />
      <main className="flex-1">
        {view === 'home' && <HomePage />}
        {view === 'movie' && <MovieDetail />}
        {view === 'tv' && <TvDetail />}
        {view === 'search' && <SearchResults />}
        {view === 'genre' && <GenreView />}
      </main>
    </div>
  );
}

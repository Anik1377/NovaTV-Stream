'use client';

import { useEffect, useState, useCallback } from 'react';
import { Film, Star, Clock, Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { Sidebar } from '@/components/movie/Sidebar';
import { Hero } from '@/components/movie/Hero';
import { TrendingRanked } from '@/components/movie/TrendingRanked';
import { PlatformSelector } from '@/components/movie/PlatformSelector';
import { ContentRow } from '@/components/movie/ContentRow';
import { MovieDetail } from '@/components/movie/MovieDetail';
import { TvDetail } from '@/components/movie/TvDetail';
import { SearchResults } from '@/components/movie/SearchResults';
import { GenreView } from '@/components/movie/GenreView';
import { LiveTV } from '@/components/live-tv/LiveTV';
import { AnimePage } from '@/components/anime/AnimePage';
import { GamesPage } from '@/components/game/GamesPage';
import { MusicPage } from '@/components/music/MusicPage';
import { SiteFooter } from '@/components/movie/SiteFooter';
import { InstallAppModal, InstallBanner } from '@/components/movie/InstallAppModal';
import type { Movie, Genre } from '@/lib/types';
import { OTT_PLATFORMS, mergeProviderLogos, type OttPlatform } from '@/lib/ott-platforms';

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

  // OTT Platform state
  const [platforms, setPlatforms] = useState<OttPlatform[]>(OTT_PLATFORMS);
  const [selectedProvider, setSelectedProvider] = useState<OttPlatform | null>(null);
  const [providerMovies, setProviderMovies] = useState<Movie[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [trendingRes, moviesRes, tvRes, topRatedRes, upcomingRes, topRatedTvRes, genresRes, providersRes] = await Promise.all([
        fetch('/api/tmdb/trending?time_window=week').then((r) => r.json()),
        fetch('/api/tmdb/popular-movies').then((r) => r.json()),
        fetch('/api/tmdb/popular-tv').then((r) => r.json()),
        fetch('/api/tmdb/top-rated').then((r) => r.json()),
        fetch('/api/tmdb/upcoming').then((r) => r.json()),
        fetch('/api/tmdb/top-rated-tv').then((r) => r.json()),
        fetch('/api/tmdb/genres').then((r) => r.json()),
        fetch('/api/tmdb/providers-list').then((r) => r.json()).catch(() => ({ results: [] })),
      ]);

      setTrending((trendingRes.results || []).slice(0, 20));
      setPopularMovies((moviesRes.results || []).slice(0, 20));
      setPopularTv((tvRes.results || []).map((t: Movie) => ({ ...t, media_type: 'tv' as const })).slice(0, 20));
      setTopRated((topRatedRes.results || []).slice(0, 20));
      setUpcoming((upcomingRes.results || []).slice(0, 20));
      setTopRatedTv((topRatedTvRes.results || []).map((t: Movie) => ({ ...t, media_type: 'tv' as const })).slice(0, 20));
      setGenres(genresRes.genres || []);
      if (providersRes.results?.length) {
        setPlatforms(mergeProviderLogos(OTT_PLATFORMS, providersRes.results));
      }
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

  const handleProviderSelect = useCallback(async (platform: OttPlatform | null) => {
    setSelectedProvider(platform);
    if (!platform) {
      setProviderMovies([]);
      return;
    }
    setProviderLoading(true);
    try {
      const [moviesRes, tvRes] = await Promise.all([
        fetch(`/api/tmdb/providers?provider_id=${platform.id}&type=movie`).then(r => r.json()),
        fetch(`/api/tmdb/providers?provider_id=${platform.id}&type=tv`).then(r => r.json()),
      ]);
      const combined = [
        ...(moviesRes.results || []).map((m: Movie) => ({ ...m, media_type: 'movie' as const })),
        ...(tvRes.results || []).map((t: Movie) => ({ ...t, media_type: 'tv' as const })),
      ].sort((a: Movie, b: Movie) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20);
      setProviderMovies(combined);
    } catch {
      setProviderMovies([]);
    } finally {
      setProviderLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Hero skeleton */}
        <div className="h-[70vh] md:h-screen bg-white/[0.03] animate-pulse" />
        {/* Genre pills skeleton */}
        <div className="px-4 md:px-8 -mt-4 mb-6 flex gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 h-8 w-20 rounded-full bg-white/[0.06] animate-pulse" />
          ))}
        </div>
        {/* Trending skeleton */}
        <div className="px-4 md:px-8 mb-8">
          <div className="h-6 w-48 rounded bg-white/[0.06] mb-4 animate-pulse" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[130px] md:w-[200px]">
                <div className="aspect-[2/3] rounded-lg bg-white/[0.06] animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-white/[0.06] mt-2 animate-pulse" />
                <div className="h-2.5 w-1/2 rounded bg-white/[0.06] mt-1.5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* Content row skeletons */}
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="px-4 md:px-8 mb-8">
            <div className="h-5 w-36 rounded bg-white/[0.06] mb-4 animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[120px] md:w-[160px]">
                  <div className="aspect-[2/3] rounded-lg bg-white/[0.06] animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-white/[0.06] mt-2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {mediaFilter === 'all' && <Hero movies={trending.slice(0, 8)} />}
      {mediaFilter === 'movie' && filteredTrending.length > 0 && <Hero movies={filteredTrending.slice(0, 8)} />}
      {mediaFilter === 'tv' && filteredTrending.length > 0 && <Hero movies={filteredTrending.slice(0, 8)} />}

      {genres.length > 0 && (
        <div className={"px-4 md:px-8 relative z-10 mb-6 " + (mediaFilter === 'all' ? '-mt-4' : 'mt-4')}>
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

      {/* Trending Right Now - Ranked */}
      <TrendingRanked movies={mediaFilter === 'all' ? trending : filteredTrending} />

      {/* Browse by Platform */}
      <PlatformSelector platforms={platforms} selectedProvider={selectedProvider?.id ?? null} onSelectProvider={handleProviderSelect} />

      {/* Platform results */}
      {selectedProvider && providerLoading && (
        <div className="px-4 md:px-8 py-8">
          <div className="flex items-center gap-3 text-white/50">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span className="text-sm">Loading {selectedProvider.name} content...</span>
          </div>
        </div>
      )}
      {selectedProvider && !providerLoading && providerMovies.length > 0 && (
        <ContentRow title={`${selectedProvider.name} — Popular`} movies={providerMovies} />
      )}
      {selectedProvider && !providerLoading && providerMovies.length === 0 && (
        <div className="px-4 md:px-8 py-8 text-center">
          <p className="text-white/40 text-sm">No results found for {selectedProvider.name}.</p>
        </div>
      )}

      {mediaFilter !== 'tv' && (
        <div>
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

      <SiteFooter />
    </div>
  );
}

export default function App() {
  const { view, navCounter } = useAppStore();
  const [installModalOpen, setInstallModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onInstallClick={() => setInstallModalOpen(true)} />
      <main className="flex-1 min-w-0 relative">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {view === 'home' && <HomePage />}
          {view === 'movie' && <MovieDetail />}
          {view === 'tv' && <TvDetail />}
          {view === 'search' && <SearchResults />}
          {view === 'genre' && <GenreView />}
          {view === 'livetv' && <LiveTV />}
          {view === 'anime' && <AnimePage />}
          {view === 'games' && <GamesPage key={navCounter} />}
          {view === 'music' && <MusicPage />}
        </motion.div>
      </main>
      <InstallBanner onOpen={() => setInstallModalOpen(true)} />
      <InstallAppModal open={installModalOpen} onClose={() => setInstallModalOpen(false)} />
    </div>
  );
}

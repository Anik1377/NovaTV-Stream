'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Film, Star, Clock, Tv, Home, Swords, Heart, Ghost, Zap,
  Shield, Globe, Baby, Clapperboard, Popcorn, Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { Sidebar } from '@/components/movie/Sidebar';
import { MobileTabBar } from '@/components/movie/MobileTabBar';
import { Hero } from '@/components/movie/Hero';
import { TrendingRanked } from '@/components/movie/TrendingRanked';
import { PlatformSelector } from '@/components/movie/PlatformSelector';
import { ContentRow } from '@/components/movie/ContentRow';
import { MovieDetail } from '@/components/movie/MovieDetail';
import { TvDetail } from '@/components/movie/TvDetail';
import { SearchResults } from '@/components/movie/SearchResults';
import { GenreView } from '@/components/movie/GenreView';
import { CategoryBrowse } from '@/components/movie/CategoryBrowse';
import { LiveTV } from '@/components/live-tv/LiveTV';
import { AnimePage } from '@/components/anime/AnimePage';
import { GamesPage } from '@/components/game/GamesPage';
import { AsianPage } from '@/components/asian/AsianPage';
import { SiteFooter } from '@/components/movie/SiteFooter';
import { MobileSearchButton } from '@/components/movie/MobileSearchButton';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { InstallAppModal, InstallBanner } from '@/components/movie/InstallAppModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuthStore } from '@/store/auth-store';
import type { Movie, Genre } from '@/lib/types';
import { OTT_PLATFORMS, mergeProviderLogos, type OttPlatform } from '@/lib/ott-platforms';


/* ── Genre category definitions ── */
interface CategoryDef {
  key: string;
  title: string;
  genreIds: string;
  mediaType: 'movie' | 'tv' | 'all';
  icon: React.ReactNode;
  showWhen: 'movie' | 'tv' | 'all';
}

const EXTRA_CATEGORIES: CategoryDef[] = [
  { key: 'action',     title: 'Action & Adventure',  genreIds: '28,12',     mediaType: 'movie', showWhen: 'movie', icon: <Swords className="w-5 h-5" /> },
  { key: 'comedy',     title: 'Comedy Movies',       genreIds: '35',       mediaType: 'movie', showWhen: 'movie', icon: <Popcorn className="w-5 h-5" /> },
  { key: 'thriller',   title: 'Thriller & Suspense', genreIds: '53,9648',  mediaType: 'movie', showWhen: 'movie', icon: <Shield className="w-5 h-5" /> },
  { key: 'romance',    title: 'Romance',             genreIds: '10749',    mediaType: 'movie', showWhen: 'movie', icon: <Heart className="w-5 h-5" /> },
  { key: 'scifi',      title: 'Sci-Fi & Fantasy',    genreIds: '878,14',   mediaType: 'all',   showWhen: 'movie', icon: <Zap className="w-5 h-5" /> },
  { key: 'horror',     title: 'Horror Movies',       genreIds: '27',       mediaType: 'movie', showWhen: 'movie', icon: <Ghost className="w-5 h-5" /> },
  { key: 'drama-tv',   title: 'Drama Series',        genreIds: '18',       mediaType: 'tv',    showWhen: 'tv',    icon: <Clapperboard className="w-5 h-5" /> },
  { key: 'crime-tv',   title: 'Crime & Mystery',     genreIds: '80,9648',  mediaType: 'tv',    showWhen: 'tv',    icon: <Shield className="w-5 h-5" /> },
  { key: 'animation',  title: 'Animation & Family',  genreIds: '16,10751', mediaType: 'all',   showWhen: 'all',   icon: <Baby className="w-5 h-5" /> },
];

/* ── Intersection Observer hook for lazy loading ── */
function useLazyLoad(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '200px 0px', threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, threshold]);

  return { ref, isVisible };
}

/* ── Lazy ContentRow wrapper ── */
function LazyContentRow({ title, icon, movies, ...props }: React.ComponentProps<typeof ContentRow>) {
  const { ref, isVisible } = useLazyLoad();
  if (!isVisible) {
    // Render placeholder to reserve space
    return (
      <div ref={ref} className="px-4 md:px-8 mb-8">
        <div className="h-5 w-36 rounded bg-white/[0.06] mb-4 animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="shrink-0 w-[120px] md:w-[160px]">
              <div className="aspect-[2/3] rounded-lg bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-white/[0.06] mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return <ContentRow title={title} icon={icon} movies={movies} {...props} />;
}

/* ── Mobile back-to-home button for anime view ── */
function MobileBackHome() {
  const { goHome } = useAppStore();
  return (
    <button
      onClick={goHome}
      className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors"
      style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }}
      aria-label="Go home"
    >
      <Home className="w-5 h-5" />
    </button>
  );
}

/* ── Surprise Me button ── */
function SurpriseMeButton({ movies }: { movies: Movie[] }) {
  const { selectMovie, selectTv } = useAppStore();
  const [spinning, setSpinning] = useState(false);

  const handleSurprise = useCallback(() => {
    if (spinning || !movies.length) return;
    setSpinning(true);
    setTimeout(() => {
      const movie = movies[Math.floor(Math.random() * movies.length)];
      if (movie.media_type === 'tv' || movie.first_air_date) {
        selectTv({ ...movie, name: movie.name || movie.title });
      } else {
        selectMovie(movie);
      }
      setSpinning(false);
    }, 600);
  }, [movies, spinning, selectMovie, selectTv]);

  if (!movies.length) return null;
  return (
    <motion.button
      onClick={handleSurprise}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-shadow"
    >
      <Sparkles className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">Surprise Me</span>
    </motion.button>
  );
}

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

  // Lazy-loaded category data
  const [categoryData, setCategoryData] = useState<Record<string, Movie[]>>({});
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // OTT Platform state
  const [platforms, setPlatforms] = useState<OttPlatform[]>(OTT_PLATFORMS);
  const [selectedProvider, setSelectedProvider] = useState<OttPlatform | null>(null);
  const [providerMovies, setProviderMovies] = useState<Movie[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);

  // SINGLE fetch for all home data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/home');
      const data = await res.json();

      setTrending((data.trending?.results || []).slice(0, 20));
      setPopularMovies((data.popularMovies?.results || []).slice(0, 20));
      setPopularTv((data.popularTv?.results || []).map((t: Movie) => ({ ...t, media_type: 'tv' as const })).slice(0, 20));
      setTopRated((data.topRated?.results || []).slice(0, 20));
      setUpcoming((data.upcoming?.results || []).slice(0, 20));
      setTopRatedTv((data.topRatedTv?.results || []).map((t: Movie) => ({ ...t, media_type: 'tv' as const })).slice(0, 20));
      setGenres(data.genres?.genres || []);
      if (data.providers?.results?.length) {
        setPlatforms(mergeProviderLogos(OTT_PLATFORMS, data.providers.results));
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lazy-load categories when they scroll into view
  const { ref: categorySentinelRef, isVisible: categoriesNearViewport } = useLazyLoad(0);

  useEffect(() => {
    if (loading || categoriesLoaded || !categoriesNearViewport) return;
    setCategoriesLoaded(true);

    const keys = EXTRA_CATEGORIES.map(c => c.key).join(',');
    fetch(`/api/home/categories?keys=${keys}`)
      .then(r => r.json())
      .then(data => setCategoryData(data))
      .catch(() => {});
  }, [loading, categoriesLoaded, categoriesNearViewport]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTrending = mediaFilter === 'movie'
    ? trending.filter(m => m.media_type === 'movie')
    : mediaFilter === 'tv'
    ? trending.filter(m => m.media_type === 'tv')
    : trending;

  const top10Source = useMemo(() => {
    if (filteredTrending.length >= 10) return filteredTrending;
    const ids = new Set(filteredTrending.map(m => m.id));
    const pool = mediaFilter === 'tv'
      ? [...popularTv, ...topRatedTv]
      : mediaFilter === 'movie'
      ? [...popularMovies, ...topRated, ...upcoming]
      : [...popularMovies, ...popularTv, ...topRated, ...topRatedTv, ...upcoming];
    const extras = pool.filter(m => !ids.has(m.id));
    return [...filteredTrending, ...extras].slice(0, 20);
  }, [filteredTrending, mediaFilter, popularMovies, popularTv, topRated, topRatedTv, upcoming]);

  const handleProviderSelect = useCallback(async (platform: OttPlatform | null) => {
    setSelectedProvider(platform);
    if (!platform) { setProviderMovies([]); return; }
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
    } catch { setProviderMovies([]); }
    finally { setProviderLoading(false); }
  }, []);

  const allMovies = useMemo(() => {
    const pool = [...trending, ...popularMovies, ...popularTv, ...topRated, ...topRatedTv, ...upcoming];
    const ids = new Set<number>();
    return pool.filter(m => { if (ids.has(m.id)) return false; ids.add(m.id); return true; });
  }, [trending, popularMovies, popularTv, topRated, topRatedTv, upcoming]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="h-[70vh] md:h-screen bg-white/[0.03] animate-pulse" />
        <div className="px-4 md:px-8 -mt-4 mb-6 flex gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={`gp-${i}`} className="shrink-0 h-8 w-20 rounded-full bg-white/[0.06] animate-pulse" />
          ))}
        </div>
        <div className="px-4 md:px-8 mb-8">
          <div className="h-6 w-48 rounded bg-white/[0.06] mb-4 animate-pulse" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={`tr-${i}`} className="shrink-0 w-[130px] md:w-[200px]">
                <div className="aspect-[2/3] rounded-lg bg-white/[0.06] animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-white/[0.06] mt-2 animate-pulse" />
                <div className="h-2.5 w-1/2 rounded bg-white/[0.06] mt-1.5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`row-${i}`} className="px-4 md:px-8 mb-8">
            <div className="h-5 w-36 rounded bg-white/[0.06] mb-4 animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 8 }, (_, j) => (
                <div key={`row-${i}-card-${j}`} className="shrink-0 w-[120px] md:w-[160px]">
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

  // Determine which categories to show based on filter
  const visibleCategories = EXTRA_CATEGORIES.filter(cat => {
    return cat.showWhen === 'all' ||
      (cat.showWhen === 'movie' && mediaFilter !== 'tv') ||
      (cat.showWhen === 'tv' && mediaFilter !== 'movie');
  });

  return (
    <div>
      {mediaFilter === 'all' && <Hero key="hero-all" movies={trending.slice(0, 8)} />}
      {mediaFilter === 'movie' && filteredTrending.length > 0 && <Hero key="hero-movie" movies={filteredTrending.slice(0, 8)} />}
      {mediaFilter === 'tv' && filteredTrending.length > 0 && <Hero key="hero-tv" movies={filteredTrending.slice(0, 8)} />}

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

      <TrendingRanked movies={top10Source} />

      <PlatformSelector platforms={platforms} selectedProvider={selectedProvider?.id ?? null} onSelectProvider={handleProviderSelect} />

      {selectedProvider && providerLoading && (
        <div key="provider-loading" className="px-4 md:px-8 py-8">
          <div className="flex items-center gap-3 text-white/50">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span className="text-sm">Loading {selectedProvider.name} content...</span>
          </div>
        </div>
      )}
      {selectedProvider && !providerLoading && providerMovies.length > 0 && (
        <ContentRow key="provider-results" title={`${selectedProvider.name} — Popular`} movies={providerMovies} />
      )}
      {selectedProvider && !providerLoading && providerMovies.length === 0 && (
        <div key="provider-empty" className="px-4 md:px-8 py-8 text-center">
          <p className="text-white/40 text-sm">No results found for {selectedProvider.name}.</p>
        </div>
      )}

      {mediaFilter !== 'tv' && (
        <div>
          <ContentRow title="Popular Movies" movies={popularMovies} icon={<Film className="w-5 h-5" />} genreId={null} mediaType="movie" sortBy="popularity.desc" />
          <ContentRow title="Top Rated Movies" movies={topRated} icon={<Star className="w-5 h-5" />} genreId={null} mediaType="movie" sortBy="vote_average.desc" />
          {upcoming.length > 0 && <ContentRow title="Coming Soon" movies={upcoming} icon={<Clock className="w-5 h-5" />} genreId={null} mediaType="movie" />}
        </div>
      )}

      {mediaFilter !== 'movie' && (
        <div>
          <ContentRow title="Popular TV Shows" movies={popularTv} icon={<Tv className="w-5 h-5" />} genreId={null} mediaType="tv" sortBy="popularity.desc" />
          <ContentRow title="Top Rated TV Shows" movies={topRatedTv} icon={<Star className="w-5 h-5" />} genreId={null} mediaType="tv" sortBy="vote_average.desc" />
        </div>
      )}

      {/* Category sentinel — triggers lazy category fetch */}
      <div ref={categorySentinelRef} className="h-1" />

      {/* Extra Genre Categories — lazy loaded */}
      {visibleCategories.map(cat => {
        const data = categoryData[cat.key] || [];
        if (!data.length) return null;

        const viewGenreId = parseInt(cat.genreIds.split(',')[0]);

        return (
          <LazyContentRow
            key={cat.key}
            title={cat.title}
            movies={data}
            icon={cat.icon}
            genreId={viewGenreId}
            mediaType={cat.mediaType}
          />
        );
      })}

      <SiteFooter />
      <SurpriseMeButton movies={allMovies} />
    </div>
  );
}

export default function App() {
  const { view, navCounter } = useAppStore();
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const fetchUser = useAuthStore(s => s.fetchUser);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onInstallClick={() => setInstallModalOpen(true)} onAuthClick={() => setAuthModalOpen(true)} />
      <main className={`flex-1 min-w-0 relative pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0`}>
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
          {view === 'category' && <CategoryBrowse />}
          {view === 'livetv' && <LiveTV />}
          {view === 'anime' && <AnimePage />}
          {view === 'asian' && <AsianPage />}
          {view === 'games' && <GamesPage key={navCounter} />}
          {view === 'profile' && <ProfilePage />}
        </motion.div>
      </main>
      <InstallBanner onOpen={() => setInstallModalOpen(true)} />
      <InstallAppModal open={installModalOpen} onClose={() => setInstallModalOpen(false)} />
      <AuthModal key={String(authModalOpen)} open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <MobileSearchButton key={view} />
      <MobileTabBar />
      {(view === 'anime' || view === 'asian') && <MobileBackHome />}
    </div>
  );
}

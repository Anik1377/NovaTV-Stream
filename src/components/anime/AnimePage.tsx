'use client';

import { useState, useEffect, useCallback, useMemo, type LucideIcon } from 'react';
import {
  Flame,
  Star,
  Play,
  Film,
  Zap,
  ChevronRight,
  Swords,
  Heart,
  Wand2,
  RotateCcw,
  Smile,
  Ghost,
  Bot,
  Flower2,
  Trophy,
  Cog,
  Search,
  Moon,
  LayoutGrid,
  TrendingUp,
  Radio,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { ContentRow } from '@/components/movie/ContentRow';
import { motion } from 'framer-motion';
import type { Movie } from '@/lib/types';

function AnimeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="8 14 58 44"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M39.584 41.0606C39.6547 41.1842 39.7206 41.3128 39.7817 41.4465C39.832 41.5895 39.8765 41.7368 39.9151 41.8883C39.941 42.0474 39.96 42.2096 39.9723 42.3751C39.9702 42.5458 39.9606 42.7186 39.9435 42.8934C39.9108 43.0709 39.87 43.2492 39.8211 43.4281C39.7559 43.607 39.6823 43.7851 39.6003 43.9625C39.5016 44.1369 39.3945 44.309 39.279 44.479C39.147 44.6428 39.0068 44.803 38.8585 44.9593C38.6943 45.1066 38.5224 45.2487 38.3429 45.3855C38.1488 45.5103 37.9477 45.6284 37.7398 45.7398C37.519 45.8365 37.2923 45.9253 37.0597 46.006C36.8166 46.0695 36.5687 46.1239 36.3163 46.1692C36.0559 46.1952 35.7923 46.211 35.5255 46.2168C35.2539 46.2016 34.9806 46.1756 34.7058 46.1387C34.4296 46.0798 34.1536 46.0095 33.8777 45.928C33.604 45.8237 33.3323 45.708 33.0627 45.5808C32.799 45.4308 32.5392 45.2696 32.2833 45.097C32.0372 44.9022 31.797 44.6966 31.5625 44.4801C31.3415 44.2427 31.1282 43.9952 30.9226 43.7375C30.7341 43.4608 30.5549 43.175 30.3851 42.8803C30.2358 42.5688 30.0974 42.2497 29.9699 41.923C29.8659 41.5825 29.7741 41.2361 29.6947 40.8836C29.6412 40.521 29.6011 40.1542 29.5745 39.7833C29.5757 39.4062 29.5912 39.0269 29.621 38.6456C29.6799 38.2624 29.7537 37.8793 29.8422 37.4963C29.9606 37.116 30.094 36.7381 30.2423 36.3626C30.4205 35.9944 30.6133 35.6311 30.821 35.2726C31.0577 34.9261 31.3085 34.5867 31.5736 34.2546C31.8661 33.9391 32.1719 33.633 32.4909 33.3364C32.8351 33.0609 33.1913 32.7969 33.5593 32.5446C33.9496 32.3175 34.3502 32.1039 34.761 31.9038C35.1904 31.7327 35.628 31.5768 36.074 31.4362C36.5343 31.3277 37.0005 31.2358 37.4729 31.1605C37.9547 31.1199 38.4401 31.0969 38.929 31.0918C39.4223 31.1229 39.9165 31.1725 40.4114 31.2406C40.9053 31.3459 41.3972 31.47 41.8871 31.6129C42.3702 31.7932 42.8485 31.9921 43.3219 32.2096C43.7828 32.4638 44.236 32.736 44.6815 33.0263C45.1088 33.3517 45.5256 33.694 45.9319 34.0534C46.3145 34.4454 46.684 34.8529 47.0403 35.2759C47.3679 35.7283 47.6799 36.1942 47.9763 36.6739C48.2394 37.1787 48.4846 37.6948 48.7122 38.2224C48.9023 38.7703 49.0728 39.327 49.2238 39.8925C49.334 40.4727 49.4232 41.0589 49.4914 41.651C49.5164 42.2518 49.5194 42.8555 49.5003 43.4619C49.4364 44.0707 49.35 44.6789 49.241 45.2867C49.0865 45.8901 48.9095 46.4896 48.7098 47.0852C48.4652 47.6696 48.1983 48.2467 47.9093 48.8166C47.5767 49.3684 47.223 49.9096 46.848 50.4402C46.432 50.9461 45.9963 51.4382 45.5408 51.9165C45.0478 52.3639 44.537 52.7944 44.0084 53.208C43.4467 53.5851 42.8697 53.9426 42.2774 54.2805C41.6573 54.5767 41.0246 54.8509 40.3796 55.1032C39.7127 55.3095 39.0366 55.4919 38.3513 55.6504C37.651 55.7594 36.9449 55.8431 36.2332 55.9014C35.5137 55.9079 34.7922 55.8881 34.0688 55.8419C33.3453 55.7426 32.6237 55.6166 31.9041 55.4639C31.1923 55.2578 30.4864 55.0253 29.7864 54.7662C29.1021 54.4547 28.4277 54.1176 27.7632 53.7547C27.1222 53.3417 26.4949 52.9043 25.8812 52.4425C25.2987 51.934 24.7335 51.403 24.1855 50.8497C23.6757 50.254 23.1866 49.6384 22.7181 49.003C22.2941 48.3307 21.8937 47.6415 21.5171 46.9355C21.1904 46.1991 20.8899 45.4493 20.6157 44.6861C20.396 43.8999 20.2046 43.104 20.0415 42.2986C19.9364 41.4782 19.8611 40.6524 19.8155 39.8211C19.8303 38.9833 19.8758 38.1445 19.9518 37.3046C20.0893 36.4672 20.2576 35.6332 20.4566 34.8026C20.717 33.9836 21.0076 33.1725 21.3286 32.3694C21.7092 31.5869 22.119 30.8168 22.558 30.0592C23.0538 29.3309 23.5769 28.6195 24.1274 27.9248C24.7304 27.2678 25.3583 26.6316 26.0112 26.0163C26.7111 25.4465 27.4329 24.9012 28.1766 24.3804C28.9607 23.912 29.7631 23.4714 30.5838 23.0586C31.4373 22.7042 32.3049 22.3803 33.1869 22.0868C34.093 21.8566 35.0088 21.659 35.9345 21.494C36.875 21.3959 37.8206 21.3318 38.7711 21.3017C39.7267 21.3407 40.6824 21.4145 41.638 21.5231C42.5886 21.7016 43.5341 21.9148 44.4746 22.1629C45.3997 22.4801 46.3146 22.8314 47.2193 23.2167C48.0986 23.6689 48.9627 24.1537 49.8116 24.6711C50.6253 25.2517 51.419 25.8626 52.1927 26.5038L62.6965 16" />
      <path d="M21.094 33.0483L10 56.1608L37.1187 55.8527" />
    </svg>
  );
}

const ANIME_GENRES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All Anime', icon: LayoutGrid },
  { id: 'action', label: 'Action', icon: Swords },
  { id: 'shonen', label: 'Shonen', icon: Flame },
  { id: 'romance', label: 'Romance', icon: Heart },
  { id: 'fantasy', label: 'Fantasy', icon: Wand2 },
  { id: 'isekai', label: 'Isekai', icon: RotateCcw },
  { id: 'comedy', label: 'Comedy', icon: Smile },
  { id: 'horror', label: 'Horror', icon: Ghost },
  { id: 'scifi', label: 'Sci-Fi', icon: Bot },
  { id: 'slice', label: 'Slice of Life', icon: Flower2 },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'mecha', label: 'Mecha', icon: Cog },
  { id: 'mystery', label: 'Mystery', icon: Search },
  { id: 'seinen', label: 'Seinen', icon: Moon },
];

// TMDB genre IDs for anime filtering
const GENRE_MAP: Record<string, number> = {
  action: 28,
  romance: 10749,
  fantasy: 14,
  comedy: 35,
  horror: 27,
  scifi: 878,
  sports: 0,
  mecha: 0,
  mystery: 9648,
};

export function AnimePage() {
  const { selectTv, selectMovie } = useAppStore();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [airing, setAiring] = useState<Movie[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [allPopular, setAllPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [heroIndex, setHeroIndex] = useState(0);

  const fetchAnime = useCallback(async () => {
    setLoading(true);
    try {
      const [trendingRes, popularRes, topRatedRes, airingRes, moviesRes, allRes] = await Promise.all([
        fetch('/api/tmdb/anime?type=trending').then((r) => r.json()),
        fetch('/api/tmdb/anime?type=popular').then((r) => r.json()),
        fetch('/api/tmdb/anime?type=top-rated').then((r) => r.json()),
        fetch('/api/tmdb/anime?type=airing').then((r) => r.json()),
        fetch('/api/tmdb/anime?type=movies').then((r) => r.json()),
        fetch('/api/tmdb/anime?type=all-popular').then((r) => r.json()),
      ]);

      setTrending((trendingRes.results || []).slice(0, 20));
      setPopular((popularRes.results || []).slice(0, 20));
      setTopRated((topRatedRes.results || []).slice(0, 20));
      setAiring((airingRes.results || []).slice(0, 20));
      setMovies((moviesRes.results || []).slice(0, 20));
      setAllPopular((allRes.results || []).slice(0, 20));
    } catch (error) {
      console.error('Failed to fetch anime:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnime();
  }, [fetchAnime]);

  // Auto-rotate hero
  useEffect(() => {
    if (trending.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(trending.length, 8));
    }, 6000);
    return () => clearInterval(timer);
  }, [trending.length]);

  const heroItems = useMemo(() => trending.slice(0, 8), [trending]);
  const heroItem = heroItems[heroIndex];

  const handleSelect = useCallback((item: Movie) => {
    if (item.media_type === 'movie') {
      selectMovie(item);
    } else {
      selectTv({ ...item, media_type: 'tv' });
    }
  }, [selectMovie, selectTv]);

  // Genre filtering for the main grid
  const filteredAiring = useMemo(() => {
    if (selectedGenre === 'all') return airing;
    if (selectedGenre === 'shonen' || selectedGenre === 'isekai' || selectedGenre === 'slice' || selectedGenre === 'mecha' || selectedGenre === 'seinen') {
      return allPopular.filter((a) => {
        const name = (a.name || '').toLowerCase();
        const overview = (a.overview || '').toLowerCase();
        switch (selectedGenre) {
          case 'shonen': return overview.includes('boy') || overview.includes('fight') || overview.includes('battle') || overview.includes('adventure') || name.includes('naruto') || name.includes('dragon') || name.includes('one piece') || name.includes('bleach') || name.includes('demon') || name.includes('jujutsu') || name.includes('my hero');
          case 'isekai': return overview.includes('another world') || overview.includes('transported') || overview.includes('summoned') || overview.includes('reincarnat') || name.includes('sao') || name.includes('sword art') || name.includes('overlord') || name.includes('re:zero') || name.includes('mushoku');
          case 'slice': return overview.includes('everyday') || overview.includes('school') || overview.includes('life') || name.includes('k-on') || name.includes('non non') || name.includes('yuru') || name.includes('hidamari');
          case 'mecha': return overview.includes('mech') || overview.includes('robot') || overview.includes('pilot') || name.includes('gundam') || name.includes('eva') || name.includes('evangelion') || name.includes('code geass');
          case 'seinen': return true;
          default: return true;
        }
      });
    }
    const gid = GENRE_MAP[selectedGenre];
    if (gid) return allPopular.filter((a) => a.genre_ids?.includes(gid));
    return airing;
  }, [selectedGenre, airing, allPopular]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="relative">
            <AnimeIcon className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
            <div className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-purple-500/20 animate-ping" />
          </div>
          <p className="text-purple-300/60 text-sm font-medium">Loading Anime...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Anime Hero Section */}
      {heroItem && (
        <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
          {/* Background with purple/pink gradient overlay */}
          <div className="absolute inset-0">
            {heroItem.backdrop_path && (
              <motion.img
                key={heroItem.id}
                src={`https://image.tmdb.org/t/p/original${heroItem.backdrop_path}`}
                alt=""
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              />
            )}
            {/* Multi-layer gradient: purple/pink anime theme */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-purple-950/30 to-purple-900/20" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/10" />
          </div>

          {/* Hero Content */}
          <div className="relative h-full flex items-end pb-20 px-4 md:px-8">
            <motion.div
              key={heroItem.id}
              className="max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Anime badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25">
                  ANIME
                </span>
                {heroItem.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                    {heroItem.vote_average.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
                {heroItem.name || heroItem.title}
              </h1>

              {/* Description */}
              <p className="text-white/60 text-sm md:text-base line-clamp-3 mb-6 max-w-xl">
                {heroItem.overview}
              </p>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSelect(heroItem)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Watch Now
                </button>
                <button
                  onClick={() => handleSelect(heroItem)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all backdrop-blur-sm border border-white/10"
                >
                  More Info
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Hero Indicators */}
          <div className="absolute bottom-6 right-4 md:right-8 flex gap-1.5">
            {heroItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === heroIndex
                    ? 'w-8 bg-purple-500'
                    : 'w-4 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Anime Genre Filter Bar */}
      <div className="relative z-10 -mt-6">
        <div className="px-4 md:px-8">
          <div className="flex items-center gap-2 overflow-x-auto content-scroll pb-4">
            {ANIME_GENRES.map((genre) => {
              const IconComp = genre.icon;
              return (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                    selectedGenre === genre.id
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10'
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80 hover:border-white/20'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{genre.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Currently Airing (filtered by genre) */}
      {filteredAiring.length > 0 && (
        <ContentRow
          title="Now Airing"
          movies={filteredAiring}
          accentColor="purple"
          icon={<Radio className="w-5 h-5" />}
        />
      )}

      {/* Popular Anime */}
      {popular.length > 0 && (
        <ContentRow
          title="Popular Anime"
          movies={popular}
          accentColor="purple"
          icon={<Flame className="w-5 h-5" />}
        />
      )}

      {/* Top Rated */}
      {topRated.length > 0 && (
        <ContentRow
          title="Top Rated Anime"
          movies={topRated}
          accentColor="purple"
          icon={<Star className="w-5 h-5" />}
        />
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <ContentRow
          title="Trending This Week"
          movies={trending}
          accentColor="purple"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      )}

      {/* Anime Movies */}
      {movies.length > 0 && (
        <ContentRow
          title="Anime Movies"
          movies={movies}
          accentColor="purple"
          icon={<Film className="w-5 h-5" />}
        />
      )}

      {/* Anime Footer */}
      <footer className="mt-16 border-t border-purple-500/10 px-4 md:px-8 py-8 pb-28 md:pb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <AnimeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold">
              Stream<span className="text-purple-400">Vault</span> <span className="text-purple-500/50 font-normal">Anime</span>
            </span>
          </div>
          <p className="text-white/30 text-xs text-center">
            Anime data powered by TMDB. All streaming content provided by non-affiliated third parties.
          </p>
          <div className="flex items-center gap-4 text-white/30 text-xs">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-purple-500" />
              Made for Anime Fans
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

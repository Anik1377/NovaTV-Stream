'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Sparkles, Flame, Star, Play, Tv, Film, Clock, Zap, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { ContentRow } from '@/components/movie/ContentRow';
import { motion } from 'framer-motion';
import type { Movie } from '@/lib/types';

const ANIME_GENRES = [
  { id: 'all', label: 'All Anime', emoji: '🎌' },
  { id: 'action', label: 'Action', emoji: '⚔️' },
  { id: 'shonen', label: 'Shonen', emoji: '🔥' },
  { id: 'romance', label: 'Romance', emoji: '💕' },
  { id: 'fantasy', label: 'Fantasy', emoji: '🧙' },
  { id: 'isekai', label: 'Isekai', emoji: '🌀' },
  { id: 'comedy', label: 'Comedy', emoji: '😂' },
  { id: 'horror', label: 'Horror', emoji: '👻' },
  { id: 'scifi', label: 'Sci-Fi', emoji: '🤖' },
  { id: 'slice', label: 'Slice of Life', emoji: '🌸' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'mecha', label: 'Mecha', emoji: '🤖' },
  { id: 'mystery', label: 'Mystery', emoji: '🔍' },
  { id: 'seinen', label: 'Seinen', emoji: '🌑' },
];

// TMDB genre IDs for anime filtering
const GENRE_MAP: Record<string, number> = {
  action: 28,
  romance: 10749,
  fantasy: 14,
  comedy: 35,
  horror: 27,
  scifi: 878,
  sports: 0, // Not a TMDB genre, filter by keyword
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
          case 'seinen': return true; // Broad match for adult anime
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
            <Sparkles className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
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
            {ANIME_GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  selectedGenre === genre.id
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10'
                    : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80 hover:border-white/20'
                }`}
              >
                <span>{genre.emoji}</span>
                <span>{genre.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Currently Airing (filtered by genre) */}
      {filteredAiring.length > 0 && (
        <ContentRow
          title="🚀 Now Airing"
          movies={filteredAiring}
          accentColor="purple"
        />
      )}

      {/* Popular Anime */}
      {popular.length > 0 && (
        <ContentRow
          title="🔥 Popular Anime"
          movies={popular}
          accentColor="purple"
        />
      )}

      {/* Top Rated */}
      {topRated.length > 0 && (
        <ContentRow
          title="⭐ Top Rated Anime"
          movies={topRated}
          accentColor="purple"
        />
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <ContentRow
          title="💫 Trending This Week"
          movies={trending}
          accentColor="purple"
        />
      )}

      {/* Anime Movies */}
      {movies.length > 0 && (
        <ContentRow
          title="🎬 Anime Movies"
          movies={movies}
          accentColor="purple"
        />
      )}

      {/* Anime Footer */}
      <footer className="mt-16 border-t border-purple-500/10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
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

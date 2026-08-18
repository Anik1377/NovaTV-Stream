'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Home, ShieldOff, Lock, Settings, Loader2, EyeOff,
  Search, X, ChevronDown, Film,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { MovieCard } from '@/components/movie/MovieCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Movie } from '@/lib/types';

interface TmdbGenre {
  id: number;
  name: string;
}

const ADULT_GENRES: TmdbGenre[] = [
  { id: 10749, name: 'Romance' },
  { id: 18, name: 'Drama' },
  { id: 53, name: 'Thriller' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 80, name: 'Crime' },
  { id: 35, name: 'Comedy' },
  { id: 36, name: 'History' },
  { id: 10752, name: 'War' },
];

export function AdultPage() {
  const { goHome, showProfile, selectMovie, selectTv } = useAppStore();
  const { user, loading: authLoading, updateProfile } = useAuthStore();
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [enabling, setEnabling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState<number>(10749);
  const searchRef = useRef<HTMLInputElement>(null);

  const isAuthed = !!user;
  const isEnabled = user?.adultEnabled ?? false;

  const fetchContent = useCallback(async (genre: number, q: string, p: number, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set('query', q);
      if (genre && !q) params.set('genre', String(genre));

      const res = await fetch(`/api/tmdb/adult?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(prev => append ? [...prev, ...data] : data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed && isEnabled) {
      setPage(1);
      fetchContent(activeGenre, searchQuery, 1, false);
    }
  }, [isAuthed, isEnabled, activeGenre]);

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    const q = searchInput.trim();
    setSearchQuery(q);
    setPage(1);
    fetchContent(0, q, 1, false);
  };

  const handleGenreClick = (genre: TmdbGenre) => {
    setActiveGenre(genre.id);
    setSearchQuery('');
    setSearchInput('');
    setPage(1);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchContent(activeGenre, searchQuery, nextPage, true);
  };

  const handleCardClick = (movie: Movie) => {
    if (movie.media_type === 'tv' || movie.name) {
      selectTv(movie);
    } else {
      selectMovie(movie);
    }
  };

  const handleEnable = async () => {
    setEnabling(true);
    const { error } = await updateProfile({ adultEnabled: true });
    setEnabling(false);
    setShowConfirm(false);
    if (error) return;
  };

  const handleDisable = async () => {
    await updateProfile({ adultEnabled: false });
    setItems([]);
    setPage(1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen">
        <div className="pt-16 md:pt-8 pb-6 px-4 md:px-8">
          <button
            onClick={goHome}
            className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-9 h-9 text-white/30" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              This section contains age-restricted content. Please sign in with your account to access it.
            </p>
            <Button
              onClick={showProfile}
              className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl px-8"
            >
              Sign In
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="min-h-screen">
        <div className="pt-16 md:pt-8 pb-6 px-4 md:px-8">
          <button
            onClick={goHome}
            className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <EyeOff className="w-9 h-9 text-white/30" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Adult Content Disabled</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-2">
              This section is currently turned off in your settings.
            </p>
            <p className="text-white/30 text-xs leading-relaxed mb-8">
              You can enable or disable it anytime from your profile settings.
            </p>
            {!showConfirm ? (
              <Button
                onClick={() => setShowConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-8"
              >
                <Settings className="w-4 h-4 mr-2" />
                Enable Adult Content
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left"
              >
                <p className="text-white/70 text-sm mb-4">
                  Are you sure? This will enable age-restricted content. You can disable it anytime from settings.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleEnable}
                    disabled={enabling}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
                  >
                    {enabling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Enable'}
                  </Button>
                  <Button
                    onClick={() => setShowConfirm(false)}
                    variant="secondary"
                    className="flex-1 bg-white/10 hover:bg-white/15 text-white rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="pt-16 md:pt-8 pb-4 px-4 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goHome}
              className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors"
              style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }}
              aria-label="Go home"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={goHome}
              className="hidden md:flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </button>
          </div>
          <button
            onClick={handleDisable}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            <ShieldOff className="w-4 h-4" />
            <span className="hidden sm:inline">Disable</span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-5"
        >
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/20 flex items-center justify-center">
            <ShieldOff className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">18+ Films</h1>
            <p className="text-white/50 text-sm">
              Mature cinema &middot; {items.length} titles
            </p>
          </div>
        </motion.div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            ref={searchRef}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search mature films..."
            className="pl-9 pr-8 h-10 bg-white/5 border-white/10 text-sm rounded-lg"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); searchRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {ADULT_GENRES.map(genre => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  activeGenre === genre.id
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-white/10'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && page === 1 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Film className="w-12 h-12 text-white/15 mx-auto mb-4" />
          <p className="text-white/40 text-sm">No results found.</p>
        </div>
      ) : (
        <>
          <div className="px-4 md:px-8 pb-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
            {items.map((m, i) => (
              <MovieCard key={`${m.id}-${m.media_type}-${i}`} movie={m} index={i} fluid />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            </div>
          )}
          {!loading && items.length > 0 && (
            <div className="flex justify-center pb-10">
              <Button
                onClick={loadMore}
                variant="secondary"
                className="bg-white/10 hover:bg-white/15 text-white rounded-xl px-8"
              >
                Load More
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Film, Tv, Users, Trash2, ArrowLeft, Loader2,
  Calendar, X, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { AuthModal } from '@/components/auth/AuthModal';
import { getImageUrl } from '@/lib/tmdb';

interface HistoryItem {
  id: string;
  userId: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv' | 'person';
  subtitle: string | null;
  visitedAt: string;
}

type FilterType = 'all' | 'movie' | 'tv' | 'person';

const FILTERS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'movie', label: 'Movies', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'tv', label: 'TV Shows', icon: <Tv className="w-3.5 h-3.5" /> },
  { key: 'person', label: 'People', icon: <Users className="w-3.5 h-3.5" /> },
];

const PAGE_SIZE = 40;

export function HistoryPage() {
  const { user, loading: authLoading } = useAuthStore();
  const { goHome, selectMovie, selectTv, selectPerson } = useAppStore();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching with loading state */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: '0' });
    if (filter !== 'all') params.set('type', filter);
    setLoading(true);
    fetch(`/api/history?${params}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled && res.ok) { setItems(data.items); setTotal(data.total); setPage(1); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, filter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const fetchMoreHistory = async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((p - 1) * PAGE_SIZE),
      });
      if (filter !== 'all') params.set('type', filter);
      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [...prev, ...data.items]);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMoreHistory(nextPage);
  };

  const handleFilterChange = (f: FilterType) => {
    if (f === filter) return;
    setFilter(f);
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((item) => item.id !== id));
    setTotal((prev) => prev - 1);
    setDeleting(null);
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all browsing history? This cannot be undone.')) return;
    await fetch('/api/history', { method: 'DELETE' });
    setItems([]);
    setTotal(0);
  };

  const handleClick = (item: HistoryItem) => {
    if (item.mediaType === 'person') {
      selectPerson({ id: item.tmdbId, name: item.title, profilePath: item.posterPath });
    } else {
      const media = {
        id: item.tmdbId,
        title: item.title,
        name: item.title,
        poster_path: item.posterPath,
        media_type: item.mediaType,
        vote_average: 0,
        genre_ids: [],
        overview: '',
        popularity: 0,
        release_date: '',
        first_air_date: '',
        backdrop_path: null,
        original_language: '',
      };
      if (item.mediaType === 'tv') selectTv(media);
      else selectMovie(media);
    }
  };

  const hasMore = items.length < total;

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <Clock className="w-9 h-9 text-white/20" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in to view History</h2>
          <p className="text-white/40 text-sm mb-6">Your browsing history is saved to your account across sessions.</p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20"
          >
            Sign In
          </button>
          <button
            onClick={goHome}
            className="flex items-center gap-2 text-white/40 hover:text-white mx-auto mt-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>
          <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="w-6 h-6 text-violet-400" />
            Browsing History
          </h1>
          <p className="text-white/40 text-sm mt-1">Your recently viewed movies, shows, and people</p>
        </div>
        {total > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 transition-all self-start"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={active
                ? 'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all bg-violet-500/15 text-violet-300 border border-violet-500/30'
                : 'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all bg-white/[0.06] text-white/50 hover:text-white/80 border border-transparent hover:border-white/10'
              }
            >
              {f.icon}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && items.length === 0 && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-white/15" />
          </div>
          <p className="text-white/30 text-sm">No history yet</p>
          <p className="text-white/20 text-xs mt-1">Movies, shows, and people you view will appear here</p>
        </div>
      )}

      {/* History list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const date = new Date(item.visitedAt);
            const timeStr = date.toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });
            const isPerson = item.mediaType === 'person';
            const imgSize = isPerson ? 'w185' : 'w92';
            const aspectClass = isPerson ? 'aspect-[3/4]' : 'aspect-[2/3]';
            const imgUrl = item.posterPath ? getImageUrl(item.posterPath, imgSize) : null;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                transition={{ duration: 0.2 }}
                onClick={() => handleClick(item)}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.08] cursor-pointer transition-all group"
              >
                {/* Thumbnail */}
                <div className={`${aspectClass} w-12 md:w-14 rounded-lg overflow-hidden bg-white/[0.06] shrink-0`}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isPerson ? <Users className="w-5 h-5 text-white/15" /> : <Film className="w-5 h-5 text-white/15" />}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm font-medium truncate group-hover:text-white transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">
                      {item.mediaType}
                    </span>
                    {item.subtitle && (
                      <span className="text-white/30 text-xs truncate">{item.subtitle}</span>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="hidden sm:flex items-center gap-1.5 text-white/25 text-xs shrink-0">
                  <Calendar className="w-3 h-3" />
                  {timeStr}
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  disabled={deleting === item.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-red-400 transition-all shrink-0"
                  aria-label="Remove from history"
                >
                  {deleting === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-all border border-white/[0.08] hover:border-white/15"
          >
            <ChevronDown className="w-4 h-4" />
            Load More
          </button>
        </div>
      )}
      {loading && items.length > 0 && (
        <div className="flex justify-center mt-8">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      )}
    </div>
  );
}

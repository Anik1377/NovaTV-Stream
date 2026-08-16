'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Search, ArrowLeft, Film, Tv, Clock, X, Loader2,
  TrendingUp, History, AlertCircle, ChevronDown, Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MovieCard } from './MovieCard';
import { useSearch } from '@/hooks/use-search';
import type { Movie } from '@/lib/types';

/* ── Media type filter ── */
type MediaFilter = 'all' | 'movie' | 'tv';
const FILTER_TABS: { key: MediaFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Search className="w-3.5 h-3.5" /> },
  { key: 'movie', label: 'Movies', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'tv', label: 'TV Shows', icon: <Tv className="w-3.5 h-3.5" /> },
];

/* ── Trending search suggestions ── */
const TRENDING_QUERIES = [
  'One Piece', 'Dragon Ball', 'Naruto', 'Breaking Bad',
  'Spider-Man', 'The Boys', 'Stranger Things', 'Attack on Titan',
  'Jujutsu Kaisen', 'Demon Slayer', 'Wednesday', 'Squid Game',
];

/* ── Skeleton grid for loading state ── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-3.5 w-3/4 rounded bg-white/[0.06] mt-2 animate-pulse" />
          <div className="h-2.5 w-1/2 rounded bg-white/[0.04] mt-1.5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ── Empty state: No query yet ── */
function EmptySearchState({
  searchHistory,
  onSubmitHistory,
  onRemoveHistory,
  onClearHistory,
}: {
  searchHistory: string[];
  onSubmitHistory: (q: string) => void;
  onRemoveHistory: (q: string) => void;
  onClearHistory: () => void;
}) {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const displayHistory = showAllHistory ? searchHistory : searchHistory.slice(0, 5);

  return (
    <div className="flex flex-col items-center pt-8 md:pt-16 pb-8 text-center max-w-2xl mx-auto">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/10 flex items-center justify-center mb-6">
        <Search className="w-9 h-9 text-red-400" />
      </div>
      <h3 className="text-white/90 text-xl md:text-2xl font-bold mb-2">Search StreamVault</h3>
      <p className="text-white/40 text-sm md:text-base mb-10">
        Find movies, TV shows, and anime instantly.
      </p>

      {/* Trending suggestions */}
      <div className="w-full mb-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Trending Searches</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_QUERIES.slice(0, showAllHistory ? undefined : 6).map((q) => (
            <button
              key={q}
              onClick={() => onSubmitHistory(q)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.06] hover:border-white/[0.12] text-white/70 hover:text-white text-sm transition-all duration-150 active:scale-95"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Search history */}
      {searchHistory.length > 0 && (
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-white/40" />
              <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider">Recent Searches</h4>
            </div>
            <button
              onClick={onClearHistory}
              className="text-white/30 hover:text-red-400 text-xs font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-1">
            {displayHistory.map((q) => (
              <div
                key={q}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors"
              >
                <button
                  onClick={() => onSubmitHistory(q)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <History className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  <span className="text-white/60 text-sm group-hover:text-white/90 transition-colors truncate">{q}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveHistory(q); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          {searchHistory.length > 5 && !showAllHistory && (
            <button
              onClick={() => setShowAllHistory(true)}
              className="mt-2 text-white/40 hover:text-white/70 text-xs font-medium transition-colors flex items-center gap-1 mx-auto"
            >
              Show all {searchHistory.length} searches
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Error state ── */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/10 flex items-center justify-center mb-5">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-white/70 text-lg font-semibold mb-2">Search Failed</h3>
      <p className="text-white/40 text-sm mb-6 max-w-sm">{message}</p>
      <Button
        onClick={onRetry}
        className="bg-white/[0.08] hover:bg-white/15 text-white border border-white/[0.08] rounded-xl gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}

/* ── No results state ── */
function NoResultsState({ query, onGoHome }: { query: string; onGoHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
        <Search className="w-9 h-9 text-white/10" />
      </div>
      <h3 className="text-white/50 text-lg font-semibold mb-2">No results found</h3>
      <p className="text-white/30 text-sm max-w-md mb-6">
        No matches for &ldquo;<span className="text-white/50">{query}</span>&rdquo;. Try different keywords or check the spelling.
      </p>
      <Button
        onClick={onGoHome}
        className="bg-white/[0.08] hover:bg-white/15 text-white border border-white/[0.08] rounded-xl"
      >
        Browse Home
      </Button>
    </div>
  );
}

/* ── Main SearchResults Component ── */
export function SearchResults() {
  const { goHome } = useAppStore();
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const loadMoreRef = useRef<HTMLButtonElement>(null);

  const {
    inputValue,
    setInputValue,
    isLoading,
    error,
    totalResults,
    hasMore,
    searchHistory,
    inputRef,
    searchQuery,
    searchResults,
    loadMore,
    retry,
    clearHistory,
    removeHistoryItem,
    submitHistoryItem,
  } = useSearch({ navigateToSearch: false });

  // Sync input from store when view first opens
  useEffect(() => {
    if (searchQuery && !inputValue) {
      setInputValue(searchQuery);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  // Reset media filter when query changes
  useEffect(() => {
    setMediaFilter('all');
  }, [searchQuery]);

  // Filter results by media type
  const filteredResults = useMemo(() => {
    if (mediaFilter === 'all') return searchResults;
    return searchResults.filter((m: Movie) => m.media_type === mediaFilter);
  }, [searchResults, mediaFilter]);

  // Count by type
  const counts = useMemo(() => ({
    all: searchResults.length,
    movie: searchResults.filter((m: Movie) => m.media_type === 'movie').length,
    tv: searchResults.filter((m: Movie) => m.media_type === 'tv').length,
  }), [searchResults]);

  return (
    <div className="pt-20 pb-10 px-4 md:px-12 lg:px-16">
      {/* Mobile search input */}
      <div className="md:hidden mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search movies, TV shows, anime..."
            className="pl-10 pr-10 bg-white/[0.08] border-white/10 text-white placeholder:text-white/30 focus:border-red-500/50 h-12 rounded-xl text-base"
          />
          {inputValue && (
            <button
              onClick={() => { setInputValue(''); goHome(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <span className="text-sm">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Back button - desktop only */}
      <button
        onClick={goHome}
        className="hidden md:flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors duration-300 group"
      >
        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      {/* Search header */}
      {searchQuery && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Search className="w-6 h-6 text-[#e50914]" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Results for &ldquo;<span className="text-[#e50914]">{searchQuery}</span>&rdquo;
            </h1>
          </div>
          <p className="text-white/40 text-sm ml-9">
            {totalResults.toLocaleString()} result{totalResults !== 1 ? 's' : ''} found
          </p>

          {/* Media type filter tabs */}
          {searchResults.length > 0 && (
            <div className="flex gap-1.5 mt-4 ml-0">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMediaFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    mediaFilter === tab.key
                      ? 'bg-white/15 text-white border border-white/10'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className={`text-xs ${mediaFilter === tab.key ? 'text-white/60' : 'text-white/30'}`}>
                    {counts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={retry} />}

      {/* Loading state (skeleton) */}
      {isLoading && !searchResults.length && <SkeletonGrid />}

      {/* No results state */}
      {!isLoading && !error && searchQuery && searchResults.length === 0 && (
        <NoResultsState query={searchQuery} onGoHome={goHome} />
      )}

      {/* Results Grid */}
      {!isLoading && !error && filteredResults.length > 0 && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            {filteredResults.map((movie, i) => (
              <MovieCard key={`${movie.id}-${movie.media_type}-${i}`} movie={movie} index={i} fluid />
            ))}
          </div>

          {/* Load More button */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <Button
                ref={loadMoreRef}
                onClick={loadMore}
                disabled={isLoading}
                className="px-8 py-5 rounded-xl bg-white/[0.08] hover:bg-white/12 text-white border border-white/[0.08] hover:border-white/15 font-medium text-sm transition-all gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty state - no query yet */}
      {!isLoading && !error && !searchQuery && (
        <EmptySearchState
          searchHistory={searchHistory}
          onSubmitHistory={submitHistoryItem}
          onRemoveHistory={removeHistoryItem}
          onClearHistory={clearHistory}
        />
      )}
    </div>
  );
}

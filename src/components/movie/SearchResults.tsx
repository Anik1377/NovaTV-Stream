'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Search, ArrowLeft, Film, Tv, X, Loader2,
  TrendingUp, History, AlertCircle, ChevronDown, RotateCw, Users,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MovieCard } from './MovieCard';
import { useSearch } from '@/hooks/use-search';
import type { Movie } from '@/lib/types';
import type { SearchPerson } from '@/store/app-store';
import { getImageUrl } from '@/lib/tmdb';

/* ── Media type filter ── */
type MediaFilter = 'all' | 'movie' | 'tv' | 'people';
const FILTER_TABS: { key: MediaFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Search className="w-3.5 h-3.5" /> },
  { key: 'movie', label: 'Movies', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'tv', label: 'TV Shows', icon: <Tv className="w-3.5 h-3.5" /> },
  { key: 'people', label: 'People', icon: <Users className="w-3.5 h-3.5" /> },
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

function PeopleSkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-3.5 w-3/4 rounded bg-white/[0.06] mt-2 animate-pulse" />
          <div className="h-2.5 w-1/2 rounded bg-white/[0.04] mt-1.5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ── Person result card ── */
function PersonResultCard({ person, onClick }: { person: SearchPerson; onClick: () => void }) {
  const imgUrl = getImageUrl(person.profile_path, 'w342');
  const knownForTitles = person.known_for?.slice(0, 2).map(kf => kf.title).filter(Boolean) || [];

  return (
    <button
      onClick={onClick}
      className="w-full group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded-xl text-left"
      aria-label={person.name}
    >
      <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2.5 border border-white/[0.06] relative">
        <img
          src={imgUrl}
          alt={person.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Department badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-medium text-lime-300 border border-lime-400/20">
            {person.known_for_department}
          </span>
        </div>
      </div>
      <p className="text-white/90 text-sm font-medium leading-tight truncate group-hover:text-white transition-colors">
        {person.name}
      </p>
      {knownForTitles.length > 0 && (
        <p className="text-white/35 text-xs mt-0.5 truncate">
          {knownForTitles.join(', ')}
        </p>
      )}
    </button>
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
        Find movies, TV shows, people, and anime instantly.
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
        <RotateCw className="w-4 h-4" />
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
  const { goHome, selectPerson } = useAppStore();
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [filterForQuery, setFilterForQuery] = useState('');
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
    searchPeople,
    loadMore,
    retry,
    clearHistory,
    removeHistoryItem,
    submitHistoryItem,
    syncFromStore,
  } = useSearch({ navigateToSearch: false });

  // Reset filter when a new query is submitted (derived state, no effect needed)
  const activeFilter = searchQuery !== filterForQuery ? 'all' : mediaFilter;
  const handleSetFilter = (f: MediaFilter) => {
    setMediaFilter(f);
    setFilterForQuery(searchQuery);
  };

  // Sync input from store when view first opens & scroll to top.
  // Uses syncFromStore which sets both inputValue AND lastSearchedQueryRef,
  // preventing the debounce effect from firing a redundant search that
  // would race with the instance that originally performed the query.
  useEffect(() => {
    syncFromStore();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [syncFromStore]);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  // Filter results by media type
  const filteredResults = useMemo(() => {
    if (activeFilter === 'all' || activeFilter === 'people') return searchResults;
    return searchResults.filter((m: Movie) => m.media_type === activeFilter);
  }, [searchResults, activeFilter]);

  // Count by type
  const counts = useMemo(() => ({
    all: searchResults.length + searchPeople.length,
    movie: searchResults.filter((m: Movie) => m.media_type === 'movie').length,
    tv: searchResults.filter((m: Movie) => m.media_type === 'tv').length,
    people: searchPeople.length,
  }), [searchResults, searchPeople]);

  const handlePersonClick = useCallback((person: SearchPerson) => {
    selectPerson({ id: person.id, name: person.name, profilePath: person.profile_path });
  }, [selectPerson]);

  // Determine if there's nothing at all to show
  const hasAnyResults = searchResults.length > 0 || searchPeople.length > 0;

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
            placeholder="Search movies, TV shows, people..."
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
          {hasAnyResults && (
            <div className="flex gap-1.5 mt-4 ml-0 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleSetFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    activeFilter === tab.key
                      ? 'bg-white/15 text-white border border-white/10'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className={`text-xs ${activeFilter === tab.key ? 'text-white/60' : 'text-white/30'}`}>
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
      {isLoading && !searchResults.length && !searchPeople.length && (
        activeFilter === 'people' ? <PeopleSkeletonGrid /> : <SkeletonGrid />
      )}

      {/* No results state */}
      {!isLoading && !error && searchQuery && !hasAnyResults && (
        <NoResultsState query={searchQuery} onGoHome={goHome} />
      )}

      {/* People tab */}
      {!isLoading && !error && (activeFilter === 'people' || activeFilter === 'all') && searchPeople.length > 0 && (
        <>
          {activeFilter === 'all' && (
            <div className="mb-6 mt-8">
              <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
                <Users className="w-5 h-5 text-lime-400" />
                People
                <span className="text-white/30 text-sm font-normal">({searchPeople.length})</span>
              </h2>
            </div>
          )}
          <div className={activeFilter === 'all' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4 mb-8' : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4'}>
            {searchPeople.map((person) => (
              <PersonResultCard
                key={`person-${person.id}`}
                person={person}
                onClick={() => handlePersonClick(person)}
              />
            ))}
          </div>
        </>
      )}

      {/* Media results grid (when not on people-only tab) */}
      {!isLoading && !error && activeFilter !== 'people' && filteredResults.length > 0 && (
        <>
          {activeFilter === 'all' && searchPeople.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
                <Film className="w-5 h-5 text-red-400" />
                Movies & TV Shows
                <span className="text-white/30 text-sm font-normal">({searchResults.length})</span>
              </h2>
            </div>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            {filteredResults.map((movie, i) => (
              <MovieCard key={`${movie.id}-${movie.media_type}-${i}`} movie={movie} index={i} fluid />
            ))}
          </div>
        </>
      )}

      {/* People-only tab: show person count message if also filtering media */}
      {!isLoading && !error && activeFilter === 'people' && searchPeople.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-white/10" />
          </div>
          <h3 className="text-white/50 text-base font-medium mb-1">No people found</h3>
          <p className="text-white/30 text-sm">Try searching for an actor or director name.</p>
        </div>
      )}

      {/* Load More button */}
      {hasMore && !error && (activeFilter !== 'people' || activeFilter === 'all') && (
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

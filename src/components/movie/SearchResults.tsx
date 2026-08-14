'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MovieCard } from './MovieCard';

export function SearchResults() {
  const { searchQuery, searchResults, goHome, setSearchQuery, setSearchResults } = useAppStore();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchQuery('');
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setSearchQuery(query);
    } catch {
      console.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [setSearchResults, setSearchQuery]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Auto-focus the input on mobile when search view opens
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search
  useEffect(() => {
    if (inputValue === searchQuery) return;
    const timer = setTimeout(() => {
      handleSearch(inputValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue, searchQuery, handleSearch]);

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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-6 h-6 text-[#e50914]" />
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
              Results for &ldquo;<span className="text-[#e50914]">{searchQuery}</span>&rdquo;
            </h1>
          </div>
          <p className="text-white/40 text-sm ml-9">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}

      {/* Searching state */}
      {isSearching && (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-white/20 border-t-red-500 rounded-full animate-spin mr-3" />
          <span className="text-white/50 text-sm">Searching...</span>
        </div>
      )}

      {/* Results Grid */}
      {!isSearching && searchResults.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
            <Search className="w-9 h-9 text-white/10" />
          </div>
          <h3 className="text-white/50 text-lg font-semibold mb-2">No results found</h3>
          <p className="text-white/30 text-sm max-w-md mb-6">
            Try searching with different keywords or check the spelling.
          </p>
          <Button
            onClick={goHome}
            className="bg-white/[0.08] hover:bg-white/15 text-white border border-white/[0.08] rounded-xl"
          >
            Browse Home
          </Button>
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {searchResults.map((movie, i) => (
            <MovieCard key={`${movie.id}-${movie.media_type}-${i}`} movie={movie} index={i} />
          ))}
        </div>
      )}

      {/* Empty state - no query yet */}
      {!isSearching && !searchQuery && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
            <Search className="w-9 h-9 text-white/20" />
          </div>
          <h3 className="text-white/50 text-lg font-semibold mb-2">Search StreamVault</h3>
          <p className="text-white/30 text-sm max-w-md">
            Type to search for movies, TV shows, and anime.
          </p>
        </div>
      )}
    </div>
  );
}

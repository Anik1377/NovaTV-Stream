'use client';

import { useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { MovieCard } from './MovieCard';

export function SearchResults() {
  const { searchQuery, searchResults, goHome } = useAppStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="pt-24 pb-10 px-6 md:px-12 lg:px-16">
      {/* Back button */}
      <button
        onClick={goHome}
        className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors duration-300 group"
      >
        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      {/* Search header */}
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

      {/* Results Grid */}
      {searchResults.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {searchResults.map((movie, i) => (
            <MovieCard key={`${movie.id}-${movie.media_type}`} movie={movie} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
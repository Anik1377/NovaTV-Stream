'client';

import { useEffect } from 'react';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { MovieCard } from './MovieCard';

export function SearchResults() {
  const { searchQuery, searchResults, goHome, setView } = useAppStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="pt-24 pb-10 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={goHome}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Results for &ldquo;<span className="text-red-500">{searchQuery}</span>&rdquo;
          </h1>
        </div>
        <p className="text-white/50 text-sm mt-1">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Results Grid */}
      {searchResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-16 h-16 text-white/10 mb-4" />
          <h3 className="text-white/60 text-lg font-medium mb-2">No results found</h3>
          <p className="text-white/40 text-sm max-w-md">
            Try searching with different keywords or check the spelling.
          </p>
          <Button
            onClick={goHome}
            variant="secondary"
            className="mt-6 bg-white/10 hover:bg-white/15 text-white"
          >
            Browse Home
          </Button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
          {searchResults.map((movie, i) => (
            <MovieCard key={`${movie.id}-${movie.media_type}`} movie={movie} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Play, Star, ArrowLeft, Calendar, Clock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from './VideoPlayer';
import { MovieCard } from './MovieCard';
import type { MovieDetails } from '@/lib/types';

export function MovieDetail() {
  const { selectedMovie, goHome } = useAppStore();
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPlayer, setShowPlayer] = useState(false);
  const prevIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedMovie || selectedMovie.id === prevIdRef.current) return;
    prevIdRef.current = selectedMovie.id;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tmdb/movie/${selectedMovie.id}`);
        const data = await res.json();
        setDetails(data);
      } catch (e) {
        console.error(e);
      }
    });
  }, [selectedMovie, startTransition]);

  if (!selectedMovie) return null;

  const movie = details || selectedMovie;
  const title = movie.title || movie.name || '';
  const year = (movie.release_date || '').split('-')[0];
  const director = details?.credits?.crew?.find((c) => c.job === 'Director');
  const cast = details?.credits?.cast?.slice(0, 8) || [];
  const similar = details?.similar?.results?.slice(0, 12) || [];
  const rating = movie.vote_average?.toFixed(1);
  const loading = isPending && !details;

  return (
    <>
      {showPlayer && (
        <VideoPlayer
          src={`https://vidsrc.sbs/embed/movie/${movie.id}`}
          title={title}
          onClose={() => setShowPlayer(false)}
        />
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">
        {/* Backdrop */}
        <div className="relative w-full h-[40vh] md:h-[55vh]">
          {movie.backdrop_path && (
            <img src={getBackdropUrl(movie.backdrop_path)} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
          <button
            onClick={goHome}
            className="absolute top-20 left-4 md:left-8 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 lg:px-12 -mt-32 md:-mt-40 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Poster */}
            <div className="shrink-0 mx-auto md:mx-0">
              <div className="w-48 md:w-56 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10">
                <img src={getImageUrl(movie.poster_path, 'w342')} alt={title} className="w-full aspect-[2/3] object-cover" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-8 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-20 bg-muted rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-2">{title}</h1>
                  {movie.tagline && (
                    <p className="text-white/50 italic text-sm md:text-base mb-3">{movie.tagline}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {rating && parseFloat(rating) > 0 && (
                      <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                        <Star className="w-4 h-4 fill-yellow-400" />
                        {rating}
                      </span>
                    )}
                    {year && (
                      <span className="flex items-center gap-1 text-white/60 text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        {year}
                      </span>
                    )}
                    {details?.runtime && details.runtime > 0 && (
                      <span className="flex items-center gap-1 text-white/60 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                      </span>
                    )}
                    {movie.original_language && (
                      <span className="flex items-center gap-1 text-white/60 text-sm uppercase">
                        <Globe className="w-3.5 h-3.5" />
                        {movie.original_language}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {details?.genres?.map((g) => (
                      <Badge key={g.id} variant="secondary" className="bg-white/10 text-white/80 hover:bg-white/15 border-0">
                        {g.name}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => setShowPlayer(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 text-base gap-2 rounded-lg mb-6"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    Play Movie
                  </Button>

                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2">Overview</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{movie.overview}</p>
                  </div>

                  {director && (
                    <div className="mb-6">
                      <h3 className="text-white font-semibold mb-2">Director</h3>
                      <p className="text-white/70 text-sm">{director.name}</p>
                    </div>
                  )}

                  {cast.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-white font-semibold mb-3">Cast</h3>
                      <div className="flex gap-3 overflow-x-auto content-scroll pb-2">
                        {cast.map((person) => (
                          <div key={person.id} className="flex-shrink-0 flex items-center gap-3 bg-white/5 rounded-lg p-2 pr-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                              {person.profile_path ? (
                                <img src={getImageUrl(person.profile_path, 'w92')} alt={person.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center text-white/40 text-xs">{person.name[0]}</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-xs font-medium truncate">{person.name}</p>
                              <p className="text-white/50 text-[10px] truncate">{person.character}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {similar.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg md:text-xl font-bold text-white mb-4">You May Also Like</h2>
              <div className="flex gap-2 md:gap-3 overflow-x-auto content-scroll pb-4">
                {similar.map((m, i) => (
                  <MovieCard key={m.id} movie={{ ...m, media_type: 'movie' }} index={i} />
                ))}
              </div>
            </section>
          )}

          <div className="h-20" />
        </div>
      </motion.div>
    </>
  );
}

'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Play, Star, ArrowLeft, Calendar, Clock, Zap, Heart, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from './VideoPlayer';
import { MovieCard } from './MovieCard';
import { ProviderSelector } from './ProviderSelector';
import { getEmbedUrl, getProvider } from '@/lib/providers';
import type { MovieDetails } from '@/lib/types';

export function MovieDetail() {
  const { selectedMovie, goBack, selectedProvider, toggleWatchlist, isInWatchlist } = useAppStore();
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPlayer, setShowPlayer] = useState(false);
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const prevIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedMovie || selectedMovie.id === prevIdRef.current) return;
    prevIdRef.current = selectedMovie.id;
    window.scrollTo({ top: 0 });
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
  const cast = details?.credits?.cast?.slice(0, 12) || [];
  const similar = details?.similar?.results?.slice(0, 15) || [];
  const rating = movie.vote_average?.toFixed(1);
  const loading = isPending && !details;
  const activeProvider = getProvider(selectedProvider);

  const handlePlay = (providerId?: string) => {
    const pid = providerId || selectedProvider;
    const url = getEmbedUrl(pid, 'movie', movie.id);
    setShowPlayer(true);
    setShowProviderSelector(false);
  };

  const renderStars = (avg: number) => {
    const full = Math.round(avg / 2);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={"w-4 h-4 " + (i < full ? 'fill-amber-400 text-amber-400' : 'fill-white/10 text-white/10')}
      />
    ));
  };

  return (
    <>
      {showPlayer && (
        <VideoPlayer
          src={getEmbedUrl(selectedProvider, 'movie', movie.id)}
          title={title}
          onClose={() => setShowPlayer(false)}
          mediaType="movie"
          tmdbId={movie.id}
        />
      )}

      <ProviderSelector
        open={showProviderSelector}
        onClose={() => setShowProviderSelector(false)}
        onPlay={handlePlay}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen"
      >
        {/* Full-width backdrop */}
        <div className="relative w-full h-[60vh]">
          {movie.backdrop_path && (
            <img
              src={getBackdropUrl(movie.backdrop_path)}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {/* Heavy bottom gradient to background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-[#0a0a0a]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/70 to-transparent" />

          {/* Floating back button pill */}
          <button
            onClick={goBack}
            className="absolute top-20 left-6 md:left-12 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Content - overlaps backdrop */}
        <div className="px-6 md:px-12 lg:px-16 -mt-36 md:-mt-44 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Floating poster */}
            <div className="shrink-0 mx-auto md:mx-0">
              <div className="w-52 md:w-60 rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.08]">
                <img
                  src={getImageUrl(movie.poster_path, 'w342')}
                  alt={title}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-2 md:pt-8">
              {loading ? (
                <div className="space-y-4">
                  <div className="h-10 bg-white/5 rounded-lg animate-pulse w-3/4" />
                  <div className="h-5 bg-white/5 rounded-lg animate-pulse w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />
                    <div className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />
                  </div>
                  <div className="h-24 bg-white/5 rounded-lg animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                    {title}
                  </h1>
                  {(movie as any).tagline && (
                    <p className="text-white/40 italic text-base md:text-lg mb-4 font-light">
                      &ldquo;{(movie as any).tagline}&rdquo;
                    </p>
                  )}

                  {/* Rating with stars */}
                  <div className="flex items-center gap-3 mb-5">
                    {rating && parseFloat(rating) > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">{renderStars(parseFloat(rating))}</div>
                        <span className="text-white/80 text-sm font-semibold">{rating}</span>
                      </div>
                    )}
                    {year && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="flex items-center gap-1.5 text-white/50 text-sm">
                          <Calendar className="w-3.5 h-3.5" />
                          {year}
                        </span>
                      </>
                    )}
                    {details?.runtime && details.runtime > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="flex items-center gap-1.5 text-white/50 text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                        </span>
                      </>
                    )}
                  </div>

                  {/* Genres as rounded pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {details?.genres?.map((g) => (
                      <span
                        key={g.id}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] text-white/70 border border-white/[0.06] hover:border-white/15 hover:text-white/90 transition-colors"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>

                  {/* Play button + Provider selector */}
                  <div className="flex items-center gap-3 mb-8">
                    <Button
                      onClick={() => setShowProviderSelector(true)}
                      className="bg-[#e50914] hover:bg-[#dc2626] text-white px-8 h-12 text-base font-semibold gap-2.5 rounded-xl shadow-lg shadow-[#e50914]/25 hover:shadow-xl hover:shadow-[#e50914]/30"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      Play Movie
                    </Button>
                    <button
                      onClick={() => setShowProviderSelector(true)}
                      className="flex items-center gap-2 px-4 h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white/90 text-sm font-medium transition-all duration-200"
                    >
                      <Zap className="w-4 h-4" style={{ color: activeProvider.color }} />
                      <span className="hidden sm:inline">{activeProvider.name}</span>
                      <span className="sm:hidden">Source</span>
                    </button>
                  </div>

                  {/* Synopsis */}
                  <div className="mb-8">
                    <h3 className="text-white font-semibold text-base mb-2.5 tracking-tight">Synopsis</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{movie.overview}</p>
                  </div>

                  {/* Director */}
                  {director && (
                    <div className="mb-8">
                      <h3 className="text-white font-semibold text-base mb-2.5 tracking-tight">Director</h3>
                      <p className="text-white/70 text-sm font-medium">{director.name}</p>
                    </div>
                  )}

                  {/* Cast - horizontal scroll with circular avatars */}
                  {cast.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-white font-semibold text-base mb-4 tracking-tight">Cast</h3>
                      <div className="flex gap-4 overflow-x-auto content-scroll no-scrollbar pb-2">
                        {cast.map((person) => (
                          <div key={person.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1a1a1a] border-2 border-white/[0.06] shrink-0">
                              {person.profile_path ? (
                                <img
                                  src={getImageUrl(person.profile_path, 'w185')}
                                  alt={person.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-white/30 text-lg font-semibold">
                                  {person.name[0]}
                                </div>
                              )}
                            </div>
                            <div className="text-center min-w-0">
                              <p className="text-white text-xs font-medium truncate block">{person.name}</p>
                              <p className="text-white/40 text-[10px] truncate block">{person.character}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Trailer */}
                  {(() => {
                    const vids = details?.videos?.results;
                    if (!vids?.length) return null;
                    const trailer = vids.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || vids[0];
                    if (!trailer) return null;
                    return (
                      <div className="mb-8">
                        <h3 className="text-white font-semibold text-base mb-4 tracking-tight flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-500" /> Trailer
                        </h3>
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/[0.06]">
                          <iframe
                            src={`https://www.youtube.com/embed/${trailer.key}?rel=0&modestbranding=1`}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={`${title} Trailer`}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Watchlist button */}
                  <button
                    onClick={() => toggleWatchlist(movie.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm font-medium transition-all duration-200 mb-8"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${isInWatchlist(movie.id) ? 'fill-red-500 text-red-500' : 'text-white/50'}`} />
                    <span className={isInWatchlist(movie.id) ? 'text-red-400' : 'text-white/60'}>
                      {isInWatchlist(movie.id) ? 'In Watchlist' : 'Add to Watchlist'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* More Like This */}
          {similar.length > 0 && (
            <section className="mt-8 mb-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-7 bg-[#e50914] rounded-full" />
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">More Like This</h2>
              </div>
              <div className="flex gap-3 md:gap-4 overflow-x-auto content-scroll no-scrollbar pb-4">
                {similar.map((m, i) => (
                  <MovieCard key={m.id} movie={{ ...m, media_type: 'movie' }} index={i} />
                ))}
              </div>
            </section>
          )}

          <div className="h-24" />
        </div>
      </motion.div>
    </>
  );
}

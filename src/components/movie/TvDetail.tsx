'use client';

import { useState, useEffect } from 'react';
import { Play, Star, ArrowLeft, Calendar, ChevronDown, Tv, Heart, Youtube, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from './VideoPlayer';
import { MovieCard } from './MovieCard';
import { getEmbedUrl, getProvider } from '@/lib/providers';
import type { TvShowDetails, SeasonDetails, Episode } from '@/lib/types';
import { useRecordHistory } from '@/lib/useRecordHistory';

export function TvDetail() {
  const { selectedTv, goBack, selectedSeason, setSelectedSeason, selectedEpisode, setSelectedEpisode, toggleWatchlist, isInWatchlist, selectedProvider } = useAppStore();
  const { record } = useRecordHistory();
  const [details, setDetails] = useState<TvShowDetails | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<SeasonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);

  useEffect(() => {
    if (!selectedTv) return;
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setLoading(true); });
    fetch(`/api/tmdb/tv/${selectedTv.id}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setDetails(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    record({
      tmdbId: selectedTv.id,
      title: selectedTv.name || 'TV Show',
      posterPath: selectedTv.poster_path,
      mediaType: 'tv',
      subtitle: (selectedTv.first_air_date || '').split('-')[0] || undefined,
    });
    return () => { cancelled = true; };
  }, [selectedTv, record]);

  useEffect(() => {
    if (!selectedTv) return;
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setSeasonLoading(true); });
    fetch(`/api/tmdb/tv/${selectedTv.id}/season/${selectedSeason}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setSeasonDetails(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setSeasonLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTv, selectedSeason]);

  if (!selectedTv) return null;

  const show = details || selectedTv;
  const title = show.title || show.name || '';
  const year = (show.first_air_date || '').split('-')[0];
  const rating = show.vote_average?.toFixed(1);
  const episodes = seasonDetails?.episodes || [];
  const seasons = details?.seasons?.filter(s => s.season_number > 0) || [];
  const cast = details?.credits?.cast?.slice(0, 8) || [];
  const similar = details?.similar?.results?.slice(0, 12) || [];

  const playEpisode = async (episode: Episode) => {
    setSelectedEpisode(episode);

    setShowPlayer(true);
  };

  const activeProvider = getProvider(selectedProvider);
  const epNum = selectedEpisode?.episode_number || 1;
  const playerUrl = getEmbedUrl(selectedProvider, 'tv', show.id, selectedSeason, epNum);

  return (
    <>
      {showPlayer && (
        <VideoPlayer
          src={playerUrl}
          title={`${title} S${String(selectedSeason).padStart(2,'0')}E${String(epNum).padStart(2,'0')}`}
          onClose={() => setShowPlayer(false)}
          mediaType="tv"
          tmdbId={show.id}
          season={selectedSeason}
          episode={epNum}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen"
      >
        {/* Backdrop */}
        <div className="relative w-full h-[40vh] md:h-[55vh]">
          {show.backdrop_path && (
            <img src={getBackdropUrl(show.backdrop_path)} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
          <button
            onClick={goBack}
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
                <img src={getImageUrl(show.poster_path, 'w342')} alt={title} className="w-full aspect-[2/3] object-cover" />
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
                  {show.tagline && (
                    <p className="text-white/50 italic text-sm md:text-base mb-3">{show.tagline}</p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {rating && parseFloat(rating) > 0 && (
                      <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                        <Star className="w-4 h-4 fill-yellow-400" />{rating}
                      </span>
                    )}
                    {year && (
                      <span className="flex items-center gap-1 text-white/60 text-sm">
                        <Calendar className="w-3.5 h-3.5" />{year}
                      </span>
                    )}
                    {details?.number_of_seasons && (
                      <span className="flex items-center gap-1 text-white/60 text-sm">
                        <Tv className="w-3.5 h-3.5" />{details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                      </span>
                    )}
                    {details?.number_of_episodes && (
                      <span className="text-white/60 text-sm">{details.number_of_episodes} Episodes</span>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {details?.genres?.map((g) => (
                      <Badge key={g.id} variant="secondary" className="bg-white/10 text-white/80 hover:bg-white/15 border-0">
                        {g.name}
                      </Badge>
                    ))}
                  </div>

                  {/* Overview */}
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2">Overview</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{show.overview}</p>
                  </div>

                  {/* Created By */}
                  {details?.created_by?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-white font-semibold mb-2">Created By</h3>
                      <p className="text-white/70 text-sm">{details.created_by.map(c => c.name).join(', ')}</p>
                    </div>
                  )}

                  {/* Trailer */}
                  {(() => {
                    const vids = details?.videos?.results;
                    if (!vids?.length) return null;
                    const trailer = vids.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || vids[0];
                    if (!trailer) return null;
                    return (
                      <div className="mb-6">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
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

                  {/* Watchlist */}
                  <button
                    onClick={() => toggleWatchlist(show.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm font-medium transition-all duration-200 mb-6"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${isInWatchlist(show.id) ? 'fill-red-500 text-red-500' : 'text-white/50'}`} />
                    <span className={isInWatchlist(show.id) ? 'text-red-400' : 'text-white/60'}>
                      {isInWatchlist(show.id) ? 'In Watchlist' : 'Add to Watchlist'}
                    </span>
                  </button>

                  {/* Cast */}
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

          {/* Season & Episode selector */}
          <div className="mt-8 mb-10">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <h2 className="text-lg md:text-xl font-bold text-white">Episodes</h2>

              {/* Season selector */}
              {seasons.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm transition-colors border border-white/10"
                  >
                    <Tv className="w-4 h-4" />
                    Season {selectedSeason}
                    <ChevronDown className={`w-4 h-4 transition-transform ${seasonDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {seasonDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-xl py-1 z-20 min-w-[180px] max-h-60 overflow-y-auto content-scroll">
                      {seasons.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedSeason(s.season_number);
                            setSeasonDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${s.season_number === selectedSeason ? 'bg-red-600/20 text-red-400' : 'text-white/80 hover:bg-white/10'}`}
                        >
                          Season {s.season_number}
                          <span className="text-white/40 ml-2">({s.episode_count} ep)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Episode list */}
            {seasonLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {episodes.map((ep) => (
                  <motion.div
                    key={ep.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 md:gap-4 bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors group border border-white/5"
                    onClick={() => playEpisode(ep)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-36 md:w-48 aspect-video rounded-md overflow-hidden bg-muted shrink-0">
                      {ep.still_path ? (
                        <img
                          src={getImageUrl(ep.still_path, 'w300')}
                          alt={ep.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Play className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white/70">
                        {ep.runtime ? `${ep.runtime}m` : '--'}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/50 text-xs font-mono">E{String(ep.episode_number).padStart(2, '0')}</span>
                        <h4 className="text-white text-sm font-semibold truncate">{ep.name}</h4>
                      </div>
                      {ep.vote_average > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400 text-xs mb-1.5">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          {ep.vote_average.toFixed(1)}
                        </span>
                      )}
                      <p className="text-white/50 text-xs leading-relaxed line-clamp-2 md:line-clamp-3">
                        {ep.overview || 'No description available.'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Similar */}
          {similar.length > 0 && (
            <section className="mt-4 mb-10 relative">
              <h2 className="text-lg md:text-xl font-bold text-white mb-4">Similar Shows</h2>
              <div className="relative">
                <div className="flex gap-2 md:gap-3 overflow-x-auto content-scroll pb-4">
                  {similar.map((m, i) => (
                    <MovieCard key={m.id} movie={{ ...m, media_type: 'tv' }} index={i} />
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#141414] to-transparent" />
              </div>
            </section>
          )}

          <div className="h-20" />
        </div>
      </motion.div>
    </>
  );
}

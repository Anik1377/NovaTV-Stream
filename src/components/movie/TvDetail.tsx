'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Star, ArrowLeft, Calendar, Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from './VideoPlayer';
import { MovieCard } from './MovieCard';
import type { TvShowDetails, SeasonDetails, Episode } from '@/lib/types';

export function TvDetail() {
  const { selectedTv, goHome, selectedSeason, setSelectedSeason, selectedEpisode, setSelectedEpisode } = useAppStore();
  const [details, setDetails] = useState<TvShowDetails | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<SeasonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const prevIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedTv) return;
    if (selectedTv.id === prevIdRef.current) return;
    prevIdRef.current = selectedTv.id;
    window.scrollTo({ top: 0 });
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setLoading(true); });
    fetch(`/api/tmdb/tv/${selectedTv.id}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setDetails(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTv]);

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
  const cast = details?.credits?.cast?.slice(0, 12) || [];
  const similar = details?.similar?.results?.slice(0, 15) || [];

  const playEpisode = (episode: Episode) => {
    setSelectedEpisode(episode);
    setShowPlayer(true);
  };

  const playerUrl = selectedEpisode
    ? `https://vidsrc.sbs/embed/tv/${show.id}/${selectedSeason}/${selectedEpisode.episode_number}`
    : `https://vidsrc.sbs/embed/tv/${show.id}/1/1`;

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
          src={playerUrl}
          title={`${title} S${String(selectedSeason).padStart(2,'0')}E${String(selectedEpisode?.episode_number || 1).padStart(2,'0')}`}
          onClose={() => setShowPlayer(false)}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen"
      >
        {/* Full-width backdrop */}
        <div className="relative w-full h-[60vh]">
          {show.backdrop_path && (
            <img src={getBackdropUrl(show.backdrop_path)} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-[#0a0a0a]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/70 to-transparent" />

          <button
            onClick={goHome}
            className="absolute top-20 left-6 md:left-12 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 md:px-12 lg:px-16 -mt-36 md:-mt-44 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Floating poster */}
            <div className="shrink-0 mx-auto md:mx-0">
              <div className="w-52 md:w-60 rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.08]">
                <img src={getImageUrl(show.poster_path, 'w342')} alt={title} className="w-full aspect-[2/3] object-cover" />
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
                  <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{title}</h1>
                  {(show as any).tagline && (
                    <p className="text-white/40 italic text-base md:text-lg mb-4 font-light">&ldquo;{(show as any).tagline}&rdquo;</p>
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
                          <Calendar className="w-3.5 h-3.5" />{year}
                        </span>
                      </>
                    )}
                    {details?.number_of_seasons && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="flex items-center gap-1.5 text-white/50 text-sm">
                          <Tv className="w-3.5 h-3.5" />{details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Genres */}
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

                  {/* Overview */}
                  <div className="mb-8">
                    <h3 className="text-white font-semibold text-base mb-2.5 tracking-tight">Synopsis</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{show.overview}</p>
                  </div>

                  {/* Created By */}
                  {details?.created_by?.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-white font-semibold text-base mb-2.5 tracking-tight">Created By</h3>
                      <p className="text-white/70 text-sm font-medium">{details.created_by.map(c => c.name).join(', ')}</p>
                    </div>
                  )}

                  {/* Cast */}
                  {cast.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-white font-semibold text-base mb-4 tracking-tight">Cast</h3>
                      <div className="flex gap-4 overflow-x-auto content-scroll no-scrollbar pb-2">
                        {cast.map((person) => (
                          <div key={person.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1a1a1a] border-2 border-white/[0.06] shrink-0">
                              {person.profile_path ? (
                                <img src={getImageUrl(person.profile_path, 'w185')} alt={person.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-white/30 text-lg font-semibold">{person.name[0]}</div>
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
                </>
              )}
            </div>
          </div>

          {/* Season & Episode selector */}
          <div className="mt-8 mb-10">
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="w-1 h-7 bg-[#e50914] rounded-full" />
                Episodes
              </h2>

              {/* Season selector as pill/segment control */}
              {seasons.length > 0 && (
                <div className="flex items-center bg-white/[0.04] rounded-full p-1 border border-white/[0.06]">
                  {seasons.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeason(s.season_number)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                        s.season_number === selectedSeason
                          ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/20'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                      }`}
                    >
                      S{s.season_number}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Episode list */}
            {seasonLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 bg-white/[0.03] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {episodes.map((ep, idx) => {
                  const isActive = selectedEpisode?.id === ep.id && showPlayer;
                  return (
                    <motion.div
                      key={ep.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.3 }}
                      onClick={() => playEpisode(ep)}
                      className={`flex gap-4 rounded-xl p-3 cursor-pointer transition-all duration-300 group border ${
                        isActive
                          ? 'bg-[#e50914]/10 border-[#e50914]/30'
                          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.04] hover:border-white/[0.08]'
                      } ${isActive ? 'border-l-[3px] border-l-[#e50914]' : ''}`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-40 md:w-52 aspect-video rounded-lg overflow-hidden bg-[#141414] shrink-0">
                        {ep.still_path ? (
                          <img
                            src={getImageUrl(ep.still_path, 'w300')}
                            alt={ep.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#141414] flex items-center justify-center">
                            <Play className="w-8 h-8 text-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                          <div className="w-10 h-10 rounded-full bg-[#e50914]/90 flex items-center justify-center shadow-lg shadow-black/40">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 bg-black/70 px-2 py-0.5 rounded-md text-[10px] text-white/60 font-medium">
                          {ep.runtime ? `${ep.runtime}m` : '--'}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="text-white/30 text-xs font-mono font-semibold">E{String(ep.episode_number).padStart(2, '0')}</span>
                          <h4 className="text-white text-sm font-semibold truncate">{ep.name}</h4>
                        </div>
                        {ep.vote_average > 0 && (
                          <span className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {ep.vote_average.toFixed(1)}
                          </span>
                        )}
                        <p className="text-white/40 text-xs leading-relaxed line-clamp-2 md:line-clamp-3">
                          {ep.overview || 'No description available.'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Similar */}
          {similar.length > 0 && (
            <section className="mt-4 mb-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-7 bg-[#e50914] rounded-full" />
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">More Like This</h2>
              </div>
              <div className="flex gap-3 md:gap-4 overflow-x-auto content-scroll no-scrollbar pb-4">
                {similar.map((m, i) => (
                  <MovieCard key={m.id} movie={{ ...m, media_type: 'tv' }} index={i} />
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

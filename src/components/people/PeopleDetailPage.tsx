'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, MapPin, ExternalLink, Film, Tv, Star,
  ChevronDown, ChevronUp, Clapperboard, Pen, Award, Play,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getImageUrl } from '@/lib/tmdb';
import type { PersonDetails as PersonDetailsType, PersonCastCredit, PersonCrewCredit, Movie } from '@/lib/types';
import { useRecordHistory } from '@/lib/useRecordHistory';

/* ── Placeholder SVG ── */
const PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="%23181a1f"><rect width="300" height="450"/><text x="150" y="225" text-anchor="middle" fill="%23333" font-family="system-ui" font-size="64">👤</text></svg>')}`;

/* ── Utility: format date nicely ── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getAge(birthday: string | null, deathday: string | null): string {
  if (!birthday) return '';
  const birth = new Date(birthday);
  const end = deathday ? new Date(deathday) : new Date();
  const age = Math.floor((end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return ` (${age} years old)`;
}

/* ── Credit card component ── */
function CreditCard({ credit, onClick }: {
  credit: PersonCastCredit | PersonCrewCredit;
  onClick: () => void;
}) {
  const title = credit.title || credit.name || 'Unknown';
  const subtitle = 'character' in credit ? credit.character : credit.job;
  const date = credit.release_date || credit.first_air_date;
  const year = date ? new Date(date).getFullYear() : null;
  const poster = credit.poster_path ? getImageUrl(credit.poster_path, 'w185') : null;

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="shrink-0 w-[130px] md:w-[150px] group text-left cursor-pointer"
    >
      <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-white/[0.06] bg-white/[0.03]">
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {'media_type' in credit && credit.media_type === 'tv'
              ? <Tv className="w-8 h-8 text-white/10" />
              : <Film className="w-8 h-8 text-white/10" />
            }
          </div>
        )}
      </div>
      <p className="text-white/90 text-xs font-medium leading-tight truncate group-hover:text-white transition-colors">
        {title}
      </p>
      <p className="text-white/40 text-[10px] mt-0.5 truncate">
        {subtitle}{year ? ` · ${year}` : ''}
      </p>
    </motion.button>
  );
}

/* ── Expandable section ── */
function ExpandableSection({
  title, icon, children, defaultOpen = false, count,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 mb-4 group w-full"
      >
        <div className="text-lime-400">{icon}</div>
        <h3 className="text-white font-semibold text-base md:text-lg flex-1 text-left">
          {title}
        </h3>
        {count !== undefined && (
          <span className="text-white/30 text-xs font-medium bg-white/[0.06] px-2.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-white/30" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: open ? 'auto' : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        {open && children}
      </motion.div>
    </div>
  );
}

/* ── Image gallery row ── */
function ImageGallery({ images }: { images: { file_path: string; aspect_ratio: number; vote_average: number }[] }) {
  if (!images.length) return null;
  const sorted = [...images].sort((a, b) => b.vote_average - a.vote_average).slice(0, 12);
  return (
    <ExpandableSection title="Gallery" icon={<Play className="w-5 h-5" />} count={images.length}>
      <div className="flex gap-3 overflow-x-auto content-scroll pb-4">
        {sorted.map((img) => (
          <div key={img.file_path} className="shrink-0 w-32 md:w-40 rounded-xl overflow-hidden border border-white/[0.06]">
            <img
              src={getImageUrl(img.file_path, 'w300')}
              alt="Gallery"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </ExpandableSection>
  );
}

export function PeopleDetailPage() {
  const { selectedPerson, goBack, selectMovie, selectTv } = useAppStore();
  const { record } = useRecordHistory();
  const [details, setDetails] = useState<PersonDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!selectedPerson) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/tmdb/people/${selectedPerson.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetails(data);
      record({
        tmdbId: selectedPerson!.id,
        title: selectedPerson!.name,
        posterPath: selectedPerson!.profilePath,
        mediaType: 'person',
        subtitle: data.known_for_department || undefined,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedPerson?.id, record]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const handleCreditClick = (credit: PersonCastCredit | PersonCrewCredit) => {
    const movie: Movie = {
      id: credit.id,
      title: credit.title || credit.name || '',
      name: credit.name,
      overview: '',
      poster_path: credit.poster_path,
      backdrop_path: credit.backdrop_path,
      release_date: credit.release_date,
      first_air_date: credit.first_air_date,
      vote_average: credit.vote_average,
      vote_count: 0,
      popularity: credit.popularity,
      adult: false,
      original_language: 'en',
    };
    if (credit.media_type === 'tv' || credit.first_air_date) {
      selectTv({ ...movie, name: movie.name || movie.title });
    } else {
      selectMovie(movie);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
        <div className="h-8 w-24 rounded-full bg-white/[0.06] animate-pulse mb-6" />
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="w-40 md:w-56 aspect-[3/4] rounded-2xl bg-white/[0.06] animate-pulse mx-auto md:mx-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-64 rounded-lg bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-40 rounded bg-white/[0.06] animate-pulse" />
            <div className="space-y-2 mt-6">
              <div className="h-3 w-full rounded bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-4/6 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-3/6 rounded bg-white/[0.06] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !details || !selectedPerson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/50 text-sm">Failed to load person details.</p>
        <div className="flex gap-3">
          <button
            onClick={goBack}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={fetchDetails}
            className="px-5 py-2.5 rounded-full bg-lime-400/15 hover:bg-lime-400/25 text-lime-300 text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profileUrl = details.profile_path ? getImageUrl(details.profile_path, 'w600') : PLACEHOLDER;

  const movieCast = details.movie_credits?.cast || [];
  const tvCast = details.tv_credits?.cast || [];
  const movieCrew = details.movie_credits?.crew || [];
  const tvCrew = details.tv_credits?.crew || [];

  // Filter crew for specific roles
  const directing = [...movieCrew, ...tvCrew].filter(c => c.job === 'Director');
  const writing = [...movieCrew, ...tvCrew].filter(c => c.job === 'Writer' || c.job === 'Screenplay');
  const producing = [...movieCrew, ...tvCrew].filter(c => c.job === 'Producer' || c.job === 'Executive Producer');

  return (
    <div className="min-h-screen">
      {/* ── Back button (mobile) ── */}
      <button
        onClick={goBack}
        className="md:hidden fixed top-3 left-3 z-[90] w-10 h-10 rounded-xl bg-black/70 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* ── Hero / Header ── */}
      <div className="relative">
        {/* Backdrop */}
        {details.images?.length ? (
          <div className="absolute inset-0 z-0">
            <img
              src={getImageUrl(details.images[0].file_path, 'w1280')}
              alt=""
              className="w-full h-72 md:h-80 object-cover opacity-20 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-background/80 to-background" />
          </div>
        ) : (
          <div className="absolute inset-0 h-48 md:h-64 bg-gradient-to-b from-lime-500/5 to-transparent" />
        )}

        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-16 md:pt-20 pb-8">
          {/* Desktop back button */}
          <button
            onClick={goBack}
            className="hidden md:flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to People
          </button>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Profile image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="shrink-0 mx-auto md:mx-0"
            >
              <div className="w-40 md:w-56 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/[0.08] shadow-2xl shadow-black/50">
                <img
                  src={profileUrl}
                  alt={details.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex-1 flex flex-col justify-center text-center md:text-left"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {details.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3 text-sm text-white/50">
                <span className="capitalize bg-white/[0.06] px-3 py-1 rounded-full text-xs font-medium">
                  {details.known_for_department}
                </span>
                {details.gender === 1 && <span>· Female</span>}
                {details.gender === 2 && <span>· Male</span>}
              </div>

              {/* Meta info */}
              <div className="flex flex-col gap-1.5 mt-5 text-sm text-white/40">
                {details.birthday && (
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-lime-400/60" />
                    <span>{formatDate(details.birthday)}{getAge(details.birthday, details.deathday)}</span>
                    {details.deathday && (
                      <span className="text-white/25">— Died {formatDate(details.deathday)}</span>
                    )}
                  </div>
                )}
                {details.place_of_birth && (
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-lime-400/60" />
                    <span>{details.place_of_birth}</span>
                  </div>
                )}
              </div>

              {/* Also known as */}
              {details.also_known_as?.length > 0 && (
                <div className="mt-4">
                  <p className="text-white/25 text-xs font-medium mb-1.5 uppercase tracking-wider">Also Known As</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                    {details.also_known_as.slice(0, 6).map((name) => (
                      <span key={name} className="text-white/40 text-xs bg-white/[0.04] px-2.5 py-1 rounded-full">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Homepage link */}
              {details.homepage && (
                <a
                  href={details.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-lime-400/70 hover:text-lime-400 text-sm font-medium transition-colors mx-auto md:mx-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Official Website
                </a>
              )}
            </motion.div>
          </div>

          {/* Biography */}
          {details.biography && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-8 max-w-3xl"
            >
              <BiographyText text={details.biography} />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Credits / Filmography ── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-16">
        {/* Movie Acting */}
        {movieCast.length > 0 && (
          <ExpandableSection
            title="Movie Acting"
            icon={<Film className="w-5 h-5" />}
            count={movieCast.length}
            defaultOpen
          >
            <div className="flex gap-3 overflow-x-auto content-scroll pb-4">
              {movieCast.map((c) => (
                <CreditCard key={`${c.id}-${c.character}`} credit={c} onClick={() => handleCreditClick(c)} />
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* TV Acting */}
        {tvCast.length > 0 && (
          <ExpandableSection
            title="TV Show Acting"
            icon={<Tv className="w-5 h-5" />}
            count={tvCast.length}
          >
            <div className="flex gap-3 overflow-x-auto content-scroll pb-4">
              {tvCast.map((c) => (
                <CreditCard key={`${c.id}-${c.character}`} credit={c} onClick={() => handleCreditClick(c)} />
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Directing */}
        {directing.length > 0 && (
          <ExpandableSection
            title="Directing"
            icon={<Clapperboard className="w-5 h-5" />}
            count={directing.length}
          >
            <div className="flex gap-3 overflow-x-auto content-scroll pb-4">
              {directing.map((c) => (
                <CreditCard key={c.id} credit={c} onClick={() => handleCreditClick(c)} />
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Writing */}
        {writing.length > 0 && (
          <ExpandableSection
            title="Writing"
            icon={<Pen className="w-5 h-5" />}
            count={writing.length}
          >
            <div className="flex gap-3 overflow-x-auto content-scroll pb-4">
              {writing.map((c) => (
                <CreditCard key={`${c.id}-${c.job}`} credit={c} onClick={() => handleCreditClick(c)} />
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Producing */}
        {producing.length > 0 && (
          <ExpandableSection
            title="Producing"
            icon={<Award className="w-5 h-5" />}
            count={producing.length}
          >
            <div className="flex gap-3 overflow-x-auto content-scroll pb-4">
              {producing.map((c) => (
                <CreditCard key={`${c.id}-${c.job}`} credit={c} onClick={() => handleCreditClick(c)} />
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Image gallery */}
        <ImageGallery images={details.images || []} />

        {/* No credits message */}
        {movieCast.length === 0 && tvCast.length === 0 && directing.length === 0 && (
          <div className="text-center py-16">
            <Film className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-sm">No known credits found for this person.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Collapsible biography ── */
function BiographyText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 400;
  const displayed = isLong && !expanded ? text.slice(0, 400) + '...' : text;

  return (
    <div>
      <h3 className="text-white/30 text-xs font-medium uppercase tracking-wider mb-3">Biography</h3>
      <p className="text-white/55 text-sm leading-relaxed whitespace-pre-line">
        {displayed}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-lime-400/70 hover:text-lime-400 text-xs font-medium transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

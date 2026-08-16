'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Film, Tv, ArrowRight, ChevronDown, Sparkles, Users, Clapperboard, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getImageUrl } from '@/lib/tmdb';
import type { Person } from '@/lib/types';

/* ── Category definitions ── */
type Category = 'popular' | 'trending';

const CATEGORIES: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: 'popular', label: 'Popular', icon: <Users className="w-4 h-4" /> },
  { key: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
];

/* ── Person profile placeholder SVG ── */
const PLACEHOLDER_IMG = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="%23181a1f"><rect width="300" height="450" rx="9999"/><text x="150" y="200" text-anchor="middle" fill="%23333" font-family="system-ui" font-size="64">👤</text><text x="150" y="260" text-anchor="middle" fill="%23444" font-family="system-ui" font-size="14">No Photo</text></svg>')}`;

/* ── Hero person card for the landing grid ── */
function HeroPersonCard({ person, index, onClick }: { person: Person; index: number; onClick: () => void }) {
  const imgUrl = person.profile_path ? getImageUrl(person.profile_path, 'w342') : PLACEHOLDER_IMG;

  return (
    <motion.button
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.04, zIndex: 10 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative w-full aspect-[3/4] rounded-full overflow-hidden border-2 border-white/[0.06] shadow-2xl shadow-black/40 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
      aria-label={person.name}
    >
      {/* Image */}
      <img
        src={imgUrl}
        alt={person.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Name label */}
      <div className="absolute inset-x-0 bottom-4 px-4 text-center">
        <p className="text-white font-semibold text-sm md:text-base leading-tight truncate drop-shadow-lg">
          {person.name}
        </p>
        <p className="text-white/50 text-xs mt-0.5 capitalize">
          {person.known_for_department}
        </p>
      </div>
    </motion.button>
  );
}

/* ── Person row card (for below the fold sections) ── */
function PersonRowCard({ person, onClick }: { person: Person; onClick: () => void }) {
  const imgUrl = person.profile_path ? getImageUrl(person.profile_path, 'w185') : PLACEHOLDER_IMG;

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="shrink-0 w-[120px] md:w-[140px] group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded-xl"
      aria-label={person.name}
    >
      <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2 border border-white/[0.06]">
        <img
          src={imgUrl}
          alt={person.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <p className="text-white/90 text-xs font-medium leading-tight truncate group-hover:text-white transition-colors">
        {person.name}
      </p>
      <p className="text-white/40 text-[10px] capitalize mt-0.5 truncate">
        {person.known_for_department}
      </p>
    </motion.button>
  );
}

/* ── Loading skeleton for hero grid ── */
function HeroGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-md">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="aspect-[3/4] rounded-full bg-white/[0.06] animate-pulse" />
      ))}
    </div>
  );
}

export function PeoplePage() {
  const { selectPerson } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<Category>('popular');
  const [popularPeople, setPopularPeople] = useState<Person[]>([]);
  const [trendingPeople, setTrendingPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const currentPeople = activeCategory === 'popular' ? popularPeople : trendingPeople;
  const setCurrentPeople = activeCategory === 'popular' ? setPopularPeople : setTrendingPeople;

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [popularRes, trendingRes] = await Promise.all([
        fetch('/api/tmdb/people?category=popular&page=1'),
        fetch('/api/tmdb/people?category=trending&page=1'),
      ]);
      const popularData = await popularRes.json();
      const trendingData = await trendingRes.json();

      setPopularPeople(popularData.results || []);
      setTrendingPeople(trendingData.results || []);
      setHasMore(activeCategory === 'popular'
        ? (popularData.total_pages || 0) > 1
        : (trendingData.total_pages || 0) > 1
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => { fetchData(); }, []);

  // Load more with IntersectionObserver
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loadMoreLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadMoreLoading) {
          setLoadMoreLoading(true);
          const nextPage = page + 1;
          fetch(`/api/tmdb/people?category=${activeCategory}&page=${nextPage}`)
            .then(r => r.json())
            .then(data => {
              setCurrentPeople(prev => [...prev, ...(data.results || [])]);
              setPage(nextPage);
              setHasMore(nextPage < (data.total_pages || 1));
            })
            .catch(() => {})
            .finally(() => setLoadMoreLoading(false));
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMoreLoading, page, activeCategory, setCurrentPeople]);

  const handlePersonClick = (person: Person) => {
    selectPerson({ id: person.id, name: person.name, profilePath: person.profile_path });
  };

  const switchCategory = (cat: Category) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
    setPage(1);
    setHasMore(true);
    if (cat === 'popular' && popularPeople.length > 0) return;
    if (cat === 'trending' && trendingPeople.length > 0) return;
  };

  // Hero grid people (first 9 for the landing section)
  const heroPeople = currentPeople.slice(0, 9);
  // Remaining for the horizontal scroll
  const remainingPeople = currentPeople.slice(9);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Hero skeleton */}
        <div className="relative min-h-[85vh] md:min-h-screen flex flex-col md:flex-row items-center justify-center px-6 md:px-12 gap-8 md:gap-16 overflow-hidden">
          <div className="w-full md:w-5/12 space-y-6">
            <div className="h-10 w-3/4 rounded-2xl bg-white/[0.06] animate-pulse" />
            <div className="h-10 w-1/2 rounded-2xl bg-white/[0.06] animate-pulse" />
            <div className="space-y-2 mt-4">
              <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-4/6 rounded bg-white/[0.06] animate-pulse" />
            </div>
            <div className="flex gap-3 mt-6">
              <div className="h-12 w-36 rounded-full bg-white/[0.06] animate-pulse" />
              <div className="h-12 w-32 rounded-full bg-white/[0.06] animate-pulse" />
            </div>
          </div>
          <div className="w-full md:w-7/12 flex justify-end">
            <HeroGridSkeleton />
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/50 text-sm">Failed to load people. Please try again.</p>
        <button
          onClick={fetchData}
          className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* HERO LANDING SECTION */}
      <section className="relative min-h-[85vh] md:min-h-screen flex flex-col md:flex-row items-center justify-center px-6 md:px-12 lg:px-16 gap-8 md:gap-12 lg:gap-16 overflow-hidden">
        {/* Abstract blur blobs */
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-lime-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-rose-500/5 rounded-full blur-[60px] pointer-events-none" />

        {/* Left column: Text + CTA */}
        <div className="relative z-10 w-full md:w-5/12 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              Discover
              <br />
              <span className="relative inline-block">
                <span className="text-lime-400">Talented</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8C30 3 60 2 100 5C140 8 170 4 198 6" stroke="#a3e635" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              People
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-white/45 text-sm md:text-base leading-relaxed mt-5 max-w-sm"
          >
            Explore the most popular actors, directors, and creators in film and television.
            Browse their work, discover new favorites, and dive into their filmography.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <button
              onClick={() => {
                document.getElementById('people-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-sm transition-all shadow-lg shadow-lime-500/20 hover:shadow-xl hover:shadow-lime-500/30 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Browse People
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium text-sm transition-all bg-white/[0.03] hover:bg-white/[0.06]"
            >
              Powered by TMDB
            </a>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="grid grid-cols-3 gap-4 mt-12 max-w-sm"
          >
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-lime-400 group-hover:bg-lime-400/15 transition-colors">
                  <Film className="w-4 h-4" />
                </div>
                <span className="text-white text-xs font-bold hidden sm:block">Cast</span>
              </div>
              <p className="text-white/30 text-[10px] pl-10 hidden sm:block">Explore actors &amp; their roles</p>
            </div>
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-amber-400 group-hover:bg-amber-400/15 transition-colors">
                  <Clapperboard className="w-4 h-4" />
                </div>
                <span className="text-white text-xs font-bold hidden sm:block">Directors</span>
              </div>
              <p className="text-white/30 text-[10px] pl-10 hidden sm:block">Visionaries behind the lens</p>
            </div>
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-rose-400 group-hover:bg-rose-400/15 transition-colors">
                  <Star className="w-4 h-4" />
                </div>
                <span className="text-white text-xs font-bold hidden sm:block">Ratings</span>
              </div>
              <p className="text-white/30 text-[10px] pl-10 hidden sm:block">Top-rated performances</p>
            </div>
          </motion.div>
        </div>

        {/* Right column: 3x3 Pill-shaped person grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 w-full md:w-7/12 flex justify-end"
        >
          {/* Floating faded cards for depth */}
          <div className="absolute -top-3 right-24 w-14 h-20 rounded-full bg-white/[0.04] border-2 border-white/[0.03] z-0 hidden lg:block" />
          <div className="absolute -top-3 right-52 w-14 h-20 rounded-full bg-white/[0.03] border-2 border-white/[0.02] z-0 hidden lg:block" />

          <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-md">
            {heroPeople.map((person, i) => (
              <HeroPersonCard
                key={person.id}
                person={person}
                index={i}
                onClick={() => handlePersonClick(person)}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* CATEGORY TABS + FULL GRID */}
      <section id="people-grid" className="px-4 md:px-8 py-12">
        {/* Section header with category tabs */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-5 h-5 text-lime-400" />
            All People
          </h2>
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => switchCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30'
                      : 'bg-white/[0.06] text-white/50 hover:text-white/80 border border-transparent hover:border-white/10'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Full horizontal scrollable row of people */}
        <div className="flex gap-3 overflow-x-auto content-scroll pb-4">
          {currentPeople.map((person) => (
            <PersonRowCard
              key={person.id}
              person={person}
              onClick={() => handlePersonClick(person)}
            />
          ))}
        </div>

        {/* Load more sentinel */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {loadMoreLoading && (
            <div className="flex items-center gap-3 text-white/40">
              <div className="w-5 h-5 border-2 border-white/10 border-t-lime-400 rounded-full animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
          {!hasMore && currentPeople.length > 0 && (
            <p className="text-white/25 text-sm">You&apos;ve seen all the people</p>
          )}
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Film, ArrowRight, Users, Clapperboard, TrendingUp, ChevronDown, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getImageUrl } from '@/lib/tmdb';
import type { Person } from '@/lib/types';

type Category = 'popular' | 'trending';

const CATEGORIES: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: 'popular', label: 'Popular', icon: <Users className="w-4 h-4" /> },
  { key: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
];

function HeroPersonCard({ person, index, onClick }: { person: Person; index: number; onClick: () => void }) {
  const imgUrl = getImageUrl(person.profile_path!, 'w342');

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
      <img
        src={imgUrl}
        alt={person.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
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

function PersonGridCard({ person, onClick }: { person: Person; onClick: () => void }) {
  const imgUrl = getImageUrl(person.profile_path!, 'w342');

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded-xl"
      aria-label={person.name}
    >
      <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2.5 border border-white/[0.06]">
        <img
          src={imgUrl}
          alt={person.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <p className="text-white/90 text-sm font-medium leading-tight truncate group-hover:text-white transition-colors">
        {person.name}
      </p>
      <p className="text-white/40 text-xs capitalize mt-0.5 truncate">
        {person.known_for_department}
      </p>
    </motion.button>
  );
}

function HeroGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-md">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="aspect-[3/4] rounded-full bg-white/[0.06] animate-pulse"></div>
      ))}
    </div>
  );
}

export function PeoplePage() {
  const { selectPerson } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<Category>('popular');
  const [peopleMap, setPeopleMap] = useState<Record<Category, Person[]>>({ popular: [], trending: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const pageRef = useRef<Record<Category, number>>({ popular: 1, trending: 1 });
  const hasMoreRef = useRef<Record<Category, boolean>>({ popular: true, trending: true });

  const fetchPeople = useCallback(async (category: Category, page: number, append: boolean) => {
    if (append) {
      setLoadMoreLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/tmdb/people?category=${category}&page=${page}&limit=50`);
      const data = await res.json();
      // Sort by popularity descending, then dedupe
      let newResults: Person[] = (data.results || []).filter((p: Person) => p.profile_path);
      newResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      const totalPages = data.total_pages || 1;

      setPeopleMap((prev) => {
        const seenIds = new Set<number>();
        const dedupedNew = newResults.filter((p) => {
          if (seenIds.has(p.id)) return false;
          seenIds.add(p.id);
          return true;
        });
        if (append) {
          const existingIds = new Set(prev[category].map((p) => p.id));
          const deduped = dedupedNew.filter((p) => !existingIds.has(p.id));
          return { ...prev, [category]: [...prev[category], ...deduped] };
        }
        return { ...prev, [category]: dedupedNew };
      });

      pageRef.current[category] = page;
      hasMoreRef.current[category] = page < totalPages;
    } catch {
      if (!append) setError(true);
    } finally {
      setLoadMoreLoading(false);
      setLoading(false);
    }
  }, []);

  // Initial fetch for both categories
  useEffect(() => {
    fetchPeople('popular', 1, false);
    fetchPeople('trending', 1, false);
  }, []);

  const currentPeople = peopleMap[activeCategory];

  const handlePersonClick = (person: Person) => {
    selectPerson({ id: person.id, name: person.name, profilePath: person.profile_path });
  };

  const switchCategory = (cat: Category) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
  };

  const handleSeeMore = () => {
    if (loadMoreLoading) return;
    const nextPage = pageRef.current[activeCategory] + 1;
    fetchPeople(activeCategory, nextPage, true);
  };

  const heroPeople = currentPeople.slice(0, 9);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative min-h-[85vh] md:min-h-screen flex flex-col md:flex-row items-center justify-center px-6 md:px-12 gap-8 md:gap-16 overflow-hidden">
          <div className="w-full md:w-5/12 space-y-6">
            <div className="h-10 w-3/4 rounded-2xl bg-white/[0.06] animate-pulse"></div>
            <div className="h-10 w-1/2 rounded-2xl bg-white/[0.06] animate-pulse"></div>
            <div className="space-y-2 mt-4">
              <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse"></div>
              <div className="h-4 w-5/6 rounded bg-white/[0.06] animate-pulse"></div>
              <div className="h-4 w-4/6 rounded bg-white/[0.06] animate-pulse"></div>
            </div>
            <div className="flex gap-3 mt-6">
              <div className="h-12 w-36 rounded-full bg-white/[0.06] animate-pulse"></div>
              <div className="h-12 w-32 rounded-full bg-white/[0.06] animate-pulse"></div>
            </div>
          </div>
          <div className="w-full md:w-7/12 flex justify-end">
            <HeroGridSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/50 text-sm">Failed to load people. Please try again.</p>
        <button
          onClick={() => fetchPeople(activeCategory, 1, false)}
          className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasMore = hasMoreRef.current[activeCategory];

  return (
    <div className="min-h-screen">
      {/* HERO LANDING SECTION */}
      <section className="relative min-h-[85vh] md:min-h-screen flex flex-col md:flex-row items-center justify-center px-6 md:px-12 lg:px-16 gap-8 md:gap-12 lg:gap-16 overflow-hidden">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-lime-500/10" style={{ filter: 'blur(100px)' }}></div>
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-amber-500/10" style={{ filter: 'blur(80px)' }}></div>
        <div className="pointer-events-none absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-rose-400/5" style={{ filter: 'blur(60px)' }}></div>

        {/* Left column */}
        <div className="relative z-10 w-full md:w-5/12 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
              Discover
              <br />
              <span className="relative inline-block">
                <span className="text-lime-400">Talented</span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-lime-400/40 rounded-full"></span>
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
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-sm transition-all shadow-lg shadow-lime-500/20 hover:shadow-xl hover:scale-105 active:scale-95"
            >
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
              <p className="text-white/30 text-[10px] pl-10 hidden sm:block">Explore actors and their roles</p>
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
          <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-md">
            {heroPeople.map((person, i) => (
              <HeroPersonCard
                key={`hero-${activeCategory}-${person.id}`}
                person={person}
                index={i}
                onClick={() => handlePersonClick(person)}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* CATEGORY TABS + VERTICAL GRID */}
      <section id="people-grid" className="px-4 md:px-8 py-12">
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
                  className={active
                    ? 'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all bg-lime-400/15 text-lime-300 border border-lime-400/30'
                    : 'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all bg-white/[0.06] text-white/50 hover:text-white/80 border border-transparent hover:border-white/10'
                  }
                >
                  {cat.icon}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vertical grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 md:gap-4">
          {currentPeople.map((person) => (
            <PersonGridCard
              key={`${activeCategory}-${person.id}`}
              person={person}
              onClick={() => handlePersonClick(person)}
            />
          ))}
        </div>

        {/* See More button */}
        <div className="mt-10 flex justify-center">
          {hasMore && (
            <button
              onClick={handleSeeMore}
              disabled={loadMoreLoading}
              className="flex items-center gap-2.5 px-8 py-3 rounded-full bg-white/[0.06] hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition-all border border-white/[0.08] hover:border-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadMoreLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {loadMoreLoading ? 'Loading...' : 'See More'}
            </button>
          )}
          {!hasMore && currentPeople.length > 0 && (
            <p className="text-white/25 text-sm">You have seen all the people</p>
          )}
        </div>
      </section>
    </div>
  );
}

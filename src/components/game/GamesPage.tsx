'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Search,
  X,
  Gamepad2,
  Grid3X3,
  Swords,
  Car,
  Crosshair,
  Joystick,
  Puzzle,
  Users,
  Gauge,
  Globe,
  Square,
  Box,
  Smartphone,
  Baby,
  Compass,
  Shield,
  Worm,
  Flame,
  MonitorPlay,
  RotateCcw,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
  type EmbedGame,
  GAME_CATEGORIES,
  loadGames,
  filterByCategory,
  searchGames,
  truncateDescription,
} from '@/lib/games-data';
import { GameRenderer } from './GameRenderer';

/* ── Category icon map ── */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Grid3X3,
  Flame,
  Swords,
  Car,
  Crosshair,
  Joystick,
  Puzzle,
  Users,
  Gauge,
  Globe,
  Square,
  Box,
  Smartphone,
  Baby,
  Compass,
  Shield,
  Worm,
};

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/5">
      <div className="aspect-[4/3] bg-white/[0.06] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-full rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-white/[0.06] animate-pulse" />
      </div>
    </div>
  );
}

/* ── Game Card with real thumbnail ── */
function GameCard({ game, onPlay }: { game: EmbedGame; onPlay: (g: EmbedGame) => void }) {
  const [imgError, setImgError] = useState(false);
  const tags = game.tags.split(',').slice(0, 3).map((t) => t.trim());

  return (
    <button
      onClick={() => onPlay(game)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/[0.08] hover:border-emerald-500/40 transition-all duration-200 text-left w-full hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-white/[0.04] overflow-hidden">
        {!imgError ? (
          <img
            src={game.image}
            alt={game.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-black flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-white/20" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 shadow-lg shadow-emerald-500/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Tags overlay */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/70 backdrop-blur-sm text-white/70 border border-white/10 capitalize"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col min-h-[80px]">
        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
          {game.title}
        </h3>
        <p className="text-white/35 text-xs mt-1 line-clamp-2 leading-relaxed">
          {truncateDescription(game.description)}
        </p>
      </div>
    </button>
  );
}

/* ── Game Player view ── */
function GamePlayer({ game, onBack }: { game: EmbedGame; onBack: () => void }) {
  const [gameKey, setGameKey] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const restart = useCallback(() => setGameKey((k) => k + 1), []);
  const tags = game.tags.split(',').map((t) => t.trim());

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Player header */}
      <div
        className="shrink-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 px-3 md:px-6 py-2.5 flex items-center justify-between"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px) + 10px, 10px)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{game.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-[10px]">Browser Game</span>
              <span className="text-white/20">·</span>
              <span className="text-white/30 text-[10px]">{tags.length} tags</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={restart}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors text-emerald-400 text-xs font-medium"
            title="Restart game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>
          <a
            href={game.embed}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 text-xs font-medium"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showInfo ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20 text-white/60'}`}
            title="Game info"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showInfo ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden bg-black/80 border-b border-white/10"
          >
            <div className="px-4 md:px-6 py-3 flex flex-col sm:flex-row gap-3">
              <img
                src={game.image}
                alt={game.title}
                className="w-20 h-14 rounded-lg object-cover shrink-0 bg-white/5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-white/60 text-xs leading-relaxed line-clamp-3">
                  {truncateDescription(game.description, 200)}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.slice(0, 8).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/70 text-[10px] font-medium border border-emerald-500/15 capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game iframe area */}
      <div className="flex-1 min-h-0">
        <GameRenderer
          embedUrl={game.embed}
          gameTitle={game.title}
          gameKey={gameKey}
        />
      </div>
    </div>
  );
}

/* ── Main Games Library Page ── */
export function GamesPage() {
  const [allGames, setAllGames] = useState<EmbedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<EmbedGame | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load games
  useEffect(() => {
    loadGames().then((games) => {
      setAllGames(games);
      setLoading(false);
    });
  }, []);

  // Filter games
  const filteredGames = useMemo(() => {
    let games = allGames;
    if (selectedCategory === 'popular') {
      // Show first 60 as "popular" (ordered by the feed)
      games = games.slice(0, 60);
    } else {
      games = filterByCategory(games, selectedCategory);
    }
    if (searchQuery.trim()) {
      games = searchGames(games, searchQuery);
    }
    return games;
  }, [allGames, selectedCategory, searchQuery]);

  // Visible games for infinite scroll
  const visibleGames = useMemo(
    () => filteredGames.slice(0, visibleCount),
    [filteredGames, visibleCount]
  );
  const hasMore = visibleCount < filteredGames.length;

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) {
          setVisibleCount((c) => c + 30);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  // Reset visible count when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(30);
  }, [selectedCategory, searchQuery]);

  const handlePlay = useCallback((game: EmbedGame) => {
    setSelectedGame(game);
    document.body.style.overflow = 'hidden';
  }, []);

  const handleBack = useCallback(() => {
    setSelectedGame(null);
    document.body.style.overflow = '';
  }, []);

  // Category count helper (must be before conditional return)
  const getCategoryCount = useCallback(
    (catId: string) => {
      if (catId === 'all') return allGames.length;
      if (catId === 'popular') return Math.min(60, allGames.length);
      return filterByCategory(allGames, catId).length;
    },
    [allGames]
  );

  // Player view (fullscreen overlay)
  if (selectedGame) {
    return <GamePlayer game={selectedGame} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-black pt-16 md:pt-20">
      {/* Hero banner */}
      <div className="relative h-[30vh] min-h-[220px] md:min-h-[280px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-green-900/30 to-black" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 50%, rgba(16,185,129,0.2) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(34,197,94,0.15) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(5,150,105,0.1) 0%, transparent 50%)',
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Gamepad2 className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 md:mb-3">
              Games <span className="text-emerald-400">Library</span>
            </h1>
            <p className="text-white/40 text-xs md:text-sm max-w-md mx-auto">
              {loading
                ? 'Loading games...'
                : `${allGames.length} free browser games — No downloads, no installs. Just click and play.`}
            </p>
          </div>
        </div>
      </div>

      {/* Search + Stats bar */}
      <div className="relative z-10 -mt-6 px-4 md:px-8">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.08] border-white/[0.08] text-sm backdrop-blur-sm focus:border-emerald-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-white/40 text-xs shrink-0 px-1">
            <span className="flex items-center gap-1">
              <MonitorPlay className="w-3.5 h-3.5" />
              {allGames.length} Games
            </span>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="px-4 md:px-8 mt-5">
        <div className="flex items-center gap-1.5 overflow-x-auto content-scroll pb-2">
          {GAME_CATEGORIES.map((cat) => {
            const IconComp = CATEGORY_ICONS[cat.icon];
            const count = getCategoryCount(cat.id);
            if (count === 0 && cat.id !== 'all') return null;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/[0.04] text-white/40 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70 hover:border-white/15'
                }`}
              >
                {IconComp && <IconComp className="w-3 h-3" />}
                <span>{cat.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.08] text-white/30'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Games grid */}
      <div className="px-4 md:px-8 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            {searchQuery ? (
              <>
                <Search className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                <span>Results for &quot;{searchQuery}&quot;</span>
                <span className="text-white/40 font-normal text-xs md:text-sm">({filteredGames.length})</span>
              </>
            ) : (
              <>
                {(() => {
                  const cat = GAME_CATEGORIES.find((c) => c.id === selectedCategory);
                  const IconComp = cat ? CATEGORY_ICONS[cat.icon] : null;
                  return IconComp ? <IconComp className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" /> : <Grid3X3 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />;
                })()}
                <span>{GAME_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'All Games'}</span>
                <span className="text-white/40 font-normal text-xs md:text-sm">({filteredGames.length})</span>
              </>
            )}
          </h2>
        </div>

        {loading ? (
          /* Skeleton grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-8">
            {Array.from({ length: 18 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredGames.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {visibleGames.map((game, idx) => (
                <GameCard key={`${game.title}-${idx}`} game={game} onPlay={handlePlay} />
              ))}
            </div>

            {/* Load more sentinel */}
            <div ref={loadMoreRef} className="h-8" />

            {/* Loading more indicator */}
            {hasMore && (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-white/15 mx-auto mb-4" />
            <p className="text-white/40 text-sm">No games found matching your search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-emerald-500/10 px-4 md:px-8 py-8 pb-28 md:pb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold">
              Stream<span className="text-emerald-400">Vault</span>{' '}
              <span className="text-emerald-500/50 font-normal">Games</span>
            </span>
          </div>
          <p className="text-white/40 text-xs text-center">
            Free embeddable HTML5 games powered by{' '}
            <a
              href="https://www.onlinegames.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400/60 hover:text-emerald-400 transition-colors"
            >
              OnlineGames.io
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            · Play instantly in your browser.
          </p>
          <div className="flex items-center gap-1 text-white/40 text-xs">
            <Gamepad2 className="w-3 h-3 text-emerald-500" />
            No Downloads Required
          </div>
        </div>
      </footer>
    </div>
  );
}

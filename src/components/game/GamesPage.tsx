'use client';

import { useState, useMemo, useCallback, type LucideIcon } from 'react';
import {
  ArrowLeft,
  Play,
  Search,
  X,
  Gamepad2,
  Grid3X3,
  Swords,
  Puzzle,
  Joystick,
  Brain,
  Trophy,
  Star,
  MonitorPlay,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GAMES, GAME_CATEGORIES, type Game } from '@/lib/games-data';
import { GameRenderer } from './GameRenderer';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  all: Grid3X3,
  action: Swords,
  puzzle: Puzzle,
  arcade: Joystick,
  strategy: Brain,
  classic: Trophy,
};

function GameCard({ game, onPlay }: { game: Game; onPlay: (g: Game) => void }) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPlay(game)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all text-left w-full"
    >
      {/* Thumbnail */}
      <div className={`relative aspect-[4/3] bg-gradient-to-br ${game.gradient} overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Gamepad2 className="w-12 h-12 text-white/30 group-hover:text-white/50 transition-colors" />
        </div>
        {game.featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/90 text-black text-[10px] font-bold">
            <Star className="w-3 h-3 fill-black" />
            FEATURED
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-medium">
          {game.players}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg shadow-emerald-500/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
          {game.title}
        </h3>
        <p className="text-white/40 text-xs mt-1 line-clamp-2 leading-relaxed">
          {game.description}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium capitalize border border-emerald-500/20">
            {game.category}
          </span>
          <span className="text-white/30 text-[10px] truncate">{game.controls}</span>
        </div>
      </div>
    </motion.button>
  );
}

function GamePlayer({ game, onBack }: { game: Game; onBack: () => void }) {
  const [gameKey, setGameKey] = useState(0);

  const restart = useCallback(() => {
    setGameKey((k) => k + 1);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Player header */}
      <div className="sticky top-16 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">{game.title}</h2>
            <p className="text-white/40 text-xs">
              {game.controls} &middot; Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/60 text-[10px]">R</kbd> to restart
            </p>
          </div>
        </div>
        <button
          onClick={restart}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors text-emerald-400 text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Restart</span>
        </button>
      </div>

      {/* Game area */}
      <div className="w-full bg-black" style={{ height: 'calc(100vh - 8rem)' }}>
        <GameRenderer gameId={game.id} gameKey={gameKey} />
      </div>
    </div>
  );
}

export function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = useMemo(() => {
    let games = GAMES;
    if (selectedCategory !== 'all') {
      games = games.filter((g) => g.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      games = games.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }
    return games;
  }, [selectedCategory, searchQuery]);

  const featuredGames = useMemo(() => GAMES.filter((g) => g.featured), []);

  const handlePlay = useCallback((game: Game) => {
    setSelectedGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedGame(null);
  }, []);

  // Player view
  if (selectedGame) {
    return <GamePlayer game={selectedGame} onBack={handleBack} />;
  }

  // Library view
  return (
    <div className="min-h-screen bg-black pt-20">
      {/* Hero banner */}
      <div className="relative h-[35vh] min-h-[250px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-green-900/40 to-black" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(16,185,129,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(34,197,94,0.1) 0%, transparent 50%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              Games <span className="text-emerald-400">Library</span>
            </h1>
            <p className="text-white/50 text-sm md:text-base max-w-lg mx-auto">
              Play free browser-based games instantly. No downloads, no installs — just click and play.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search + Stats bar */}
      <div className="relative z-10 -mt-6 px-4 md:px-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50 transition-colors backdrop-blur-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-white/30 text-xs shrink-0">
            <span className="flex items-center gap-1">
              <MonitorPlay className="w-3.5 h-3.5" />
              {GAMES.length} Games
            </span>
            <span className="flex items-center gap-1">
              <Grid3X3 className="w-3.5 h-3.5" />
              {GAME_CATEGORIES.length - 1} Categories
            </span>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="px-4 md:px-8 mt-5">
        <div className="flex items-center gap-2 overflow-x-auto content-scroll pb-2">
          {GAME_CATEGORIES.map((cat) => {
            const IconComp = CATEGORY_ICONS[cat.id];
            const count =
              cat.id === 'all'
                ? GAMES.length
                : GAMES.filter((g) => g.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80 hover:border-white/20'
                }`}
              >
                {IconComp && <IconComp className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured games row */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="px-4 md:px-8 mt-8 mb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            Featured Games
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {featuredGames.map((game) => (
              <GameCard key={game.id} game={game} onPlay={handlePlay} />
            ))}
          </div>
        </div>
      )}

      {/* Game grid */}
      <div className="px-4 md:px-8 mt-6">
        {selectedCategory !== 'all' || searchQuery ? (
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            {searchQuery ? (
              <>
                <Search className="w-5 h-5 text-emerald-400" />
                Results for &quot;{searchQuery}&quot;
                <span className="text-white/30 font-normal text-sm ml-1">({filteredGames.length})</span>
              </>
            ) : (
              <>
                {(() => {
                  const IconComp = CATEGORY_ICONS[selectedCategory];
                  return IconComp ? <IconComp className="w-5 h-5 text-emerald-400" /> : null;
                })()}
                {GAME_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                <span className="text-white/30 font-normal text-sm ml-1">({filteredGames.length})</span>
              </>
            )}
          </h2>
        ) : (
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Grid3X3 className="w-5 h-5 text-emerald-400" />
            All Games
          </h2>
        )}

        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-8">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} onPlay={handlePlay} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
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

      {/* Games Footer */}
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
          <p className="text-white/30 text-xs text-center">
            Open-source HTML5 games from{' '}
            <a
              href="https://github.com/KoRifCan/Classic-Games"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400/60 hover:text-emerald-400 transition-colors"
            >
              KoRifCan/Classic-Games
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            &middot; Play instantly in your browser.
          </p>
          <div className="flex items-center gap-1 text-white/30 text-xs">
            <Gamepad2 className="w-3 h-3 text-emerald-500" />
            No Downloads Required
          </div>
        </div>
      </footer>
    </div>
  );
}

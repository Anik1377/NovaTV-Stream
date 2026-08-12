'use client';

import { Home, Film, Tv, Gamepad2, Music, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

interface TabItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  activeColor: string;
}

export function MobileTabBar() {
  const { view, mediaFilter, goHome, showMovies, showTvShows, showAnime, showGames, showMusic } = useAppStore();

  const isSpecialView = view === 'search' || view === 'movie' || view === 'tv' || view === 'genre' || view === 'livetv';

  const isActive = (key: string) => {
    switch (key) {
      case 'home':
        return view === 'home' && mediaFilter === 'all' && !isSpecialView;
      case 'movies':
        return view === 'home' && mediaFilter === 'movie' && !isSpecialView;
      case 'tvshows':
        return view === 'home' && mediaFilter === 'tv' && !isSpecialView;
      case 'anime':
        return view === 'anime';
      case 'games':
        return view === 'games';
      case 'music':
        return view === 'music';
      default:
        return false;
    }
  };

  const getIconColor = (key: string, active: boolean) => {
    if (!active) return 'text-white/40';
    if (key === 'anime') return 'text-purple-400';
    if (key === 'games') return 'text-emerald-400';
    if (key === 'music') return 'text-amber-400';
    return 'text-red-500';
  };

  const getTextColor = (key: string, active: boolean) => {
    if (!active) return 'text-white/40';
    return 'text-white';
  };

  const getIndicatorColor = (key: string) => {
    if (key === 'anime') return 'bg-purple-400';
    if (key === 'games') return 'bg-emerald-400';
    if (key === 'music') return 'bg-amber-400';
    return 'bg-red-500';
  };

  const tabs: TabItem[] = [
    { key: 'home', label: 'Home', icon: Home, action: goHome, activeColor: 'text-red-500' },
    { key: 'movies', label: 'Movies', icon: Film, action: showMovies, activeColor: 'text-red-500' },
    { key: 'tvshows', label: 'TV', icon: Tv, action: showTvShows, activeColor: 'text-red-500' },
    { key: 'anime', label: 'Anime', icon: Sparkles, action: showAnime, activeColor: 'text-purple-400' },
    { key: 'games', label: 'Games', icon: Gamepad2, action: showGames, activeColor: 'text-emerald-400' },
    { key: 'music', label: 'Music', icon: Music, action: showMusic, activeColor: 'text-amber-400' },
  ];

  const handleTabClick = (tab: TabItem) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    tab.action();
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="h-16 flex items-center justify-around px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          return (
            <motion.button
              key={tab.key}
              onClick={() => handleTabClick(tab)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative"
            >
              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="mobileTabIndicator"
                  className={`absolute -top-1 w-6 h-0.5 rounded-full ${getIndicatorColor(tab.key)}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <tab.icon className={`w-5 h-5 ${getIconColor(tab.key, active)}`} />
              </motion.div>
              <span className={`text-[10px] font-medium leading-tight ${getTextColor(tab.key, active)}`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

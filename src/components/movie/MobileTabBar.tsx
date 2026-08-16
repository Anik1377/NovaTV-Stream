'use client';

import { useState, useMemo, useCallback } from 'react';
import { Home, Film, Tv, User, Gamepad2, Radio, MoreHorizontal, Globe, Clapperboard, BookOpen, Users } from 'lucide-react';
import { ProfileAvatar } from '@/lib/avatars';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerTitle,
} from '@/components/ui/drawer';

/* ── Lightweight anime icon (simplified) ── */
function AnimeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3c-1.2 3-4 5.5-4 8.5a4 4 0 0 0 8 0c0-3-2.8-5.5-4-8.5Z" />
      <path d="M12 21v-3" />
    </svg>
  );
}

/* ── Types ── */
interface TabDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface MoreDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  color: string;
}

export function MobileTabBar() {
  const {
    view, mediaFilter,
    goHome, showMovies, showTvShows, showAnime,
    showAsian, showGames, showShowreels, showRead,
    showLiveTV, showProfile, showPeople,
  } = useAppStore();
  const authUser = useAuthStore((s) => s.user);
  const [moreOpen, setMoreOpen] = useState(false);

  const isSpecialView = view === 'movie' || view === 'tv' || view === 'genre' || view === 'livetv' || view === 'category';

  /* ── Tab definitions (memoized) ── */
  const tabs: TabDef[] = useMemo(() => [
    { key: 'home', label: 'Home', icon: Home, action: goHome },
    { key: 'movies', label: 'Movies', icon: Film, action: showMovies },
    { key: 'tvshows', label: 'TV', icon: Tv, action: showTvShows },
    { key: 'anime', label: 'Anime', icon: AnimeIcon, action: showAnime },
    { key: 'profile', label: 'Profile', icon: User, action: showProfile },
  ], [goHome, showMovies, showTvShows, showAnime, showProfile]);

  const moreItems: MoreDef[] = useMemo(() => [
    { key: 'games', label: 'Games', icon: Gamepad2, action: showGames, color: 'text-emerald-400' },
    { key: 'livetv', label: 'Live TV', icon: Radio, action: showLiveTV, color: 'text-blue-400' },
    { key: 'asian', label: 'Asian Cinema', icon: Globe, action: showAsian, color: 'text-rose-400' },
    { key: 'showreels', label: 'ShowReels', icon: Clapperboard, action: showShowreels, color: 'text-amber-400' },
    { key: 'read', label: 'Read', icon: BookOpen, action: showRead, color: 'text-sky-400' },
    { key: 'people', label: 'People', icon: Users, action: showPeople, color: 'text-lime-400' },
  ], [showGames, showLiveTV, showAsian, showShowreels, showRead, showPeople]);

  /* ── Active state ── */
  const isActive = useCallback((key: string) => {
    switch (key) {
      case 'home': return view === 'home' && mediaFilter === 'all' && !isSpecialView;
      case 'movies': return view === 'home' && mediaFilter === 'movie' && !isSpecialView;
      case 'tvshows': return view === 'home' && mediaFilter === 'tv' && !isSpecialView;
      case 'anime': return view === 'anime';
      case 'more': return ['games','livetv','asian','showreels','showreel-detail','read','manga-detail','manga-reader','people','people-detail'].includes(view);
      case 'profile': return view === 'profile';
      default: return false;
    }
  }, [view, mediaFilter, isSpecialView]);

  /* Find active index for indicator position */
  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex(t => isActive(t.key));
    if (idx >= 0) return idx;
    return isActive('more') ? tabs.length : -1;
  }, [tabs, isActive]);

  const getIconColor = (key: string, active: boolean): string => {
    if (!active) return 'text-white/40';
    if (key === 'anime') return 'text-purple-400';
    if (key === 'more') return 'text-orange-400';
    return 'text-red-500';
  };

  const handleTabClick = (tab: TabDef) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    tab.action();
  };

  const handleMoreItemClick = (item: MoreDef) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMoreOpen(false);
    item.action();
  };

  const isMoreActive = isActive('more');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/[0.08]">
      <div
        className="relative flex items-center justify-around px-1"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Sliding indicator — pure CSS transform, no Framer Motion */}
        {activeIndex >= 0 && (
          <div
            className="absolute top-0 h-[2px] w-6 rounded-full bg-red-500 pointer-events-none"
            style={{
              left: `${(activeIndex + 0.5) * (100 / (tabs.length + 1))}%`,
              transform: 'translateX(-50%)',
              transition: 'left 0.2s ease',
              ...(activeIndex === 3 ? { backgroundColor: '#a855f7' } : {}),
            }}
          />
        )}
        {isMoreActive && (
          <div
            className="absolute top-0 h-[2px] w-6 rounded-full bg-orange-400 pointer-events-none"
            style={{
              left: `${(tabs.length + 0.5) * (100 / (tabs.length + 1))}%`,
              transform: 'translateX(-50%)',
            }}
          />
        )}

        {/* Tab buttons */}
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          const IconComp = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 relative select-none active:scale-95 transition-transform duration-100"
            >
              {tab.key === 'profile' && authUser ? (
                <span className={`block w-5 h-5 rounded-full overflow-hidden ${active ? '' : 'opacity-50'}`}>
                  <ProfileAvatar slug={authUser.avatar} size={20} />
                </span>
              ) : (
                <IconComp className={`w-5 h-5 transition-colors duration-150 ${getIconColor(tab.key, active)}`} />
              )}
              <span className={`text-[10px] font-medium leading-tight transition-colors duration-150 ${active ? 'text-white' : 'text-white/40'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
          <DrawerTrigger asChild>
            <button
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 relative select-none active:scale-95 transition-transform duration-100`}
            >
              <MoreHorizontal className={`w-5 h-5 transition-colors duration-150 ${getIconColor('more', isMoreActive)}`} />
              <span className={`text-[10px] font-medium leading-tight transition-colors duration-150 ${isMoreActive ? 'text-white' : 'text-white/40'}`}>
                More
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className="sr-only">More</DrawerTitle>
            <div className="px-4 pt-2 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">More</h3>
                <DrawerClose asChild>
                  <button className="text-white/50 hover:text-white/80 transition-colors p-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                  </button>
                </DrawerClose>
              </div>
              <div className="space-y-1.5">
                {moreItems.map((item) => {
                  const active =
                    item.key === 'games' ? view === 'games' :
                    item.key === 'livetv' ? view === 'livetv' :
                    item.key === 'asian' ? view === 'asian' :
                    item.key === 'showreels' ? (view === 'showreels' || view === 'showreel-detail') :
                    item.key === 'read' ? (view === 'read' || view === 'manga-detail' || view === 'manga-reader') :
                    item.key === 'people' ? (view === 'people' || view === 'people-detail') :
                    false;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleMoreItemClick(item)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors active:scale-[0.98] ${
                        active ? 'bg-white/10' : 'hover:bg-white/5 active:bg-white/10'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${active ? 'bg-white/10' : 'bg-white/5'}`}>
                        <IconComp className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className={`text-[15px] font-medium ${active ? 'text-white' : 'text-white/70'}`}>
                        {item.label}
                      </span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}

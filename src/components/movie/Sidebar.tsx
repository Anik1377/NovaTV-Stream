'use client';

import { useState } from 'react';
import {
  Search,
  Film,
  Tv,
  Home,
  Radio,
  Gamepad2,
  Download,
  X,
  LogIn,
  LogOut,
  Globe,
  Clapperboard,
  BookOpen,
  Users,
  Flame,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { AnimeIcon } from '@/components/icons/AnimeIcon';
import { useSearch } from '@/hooks/use-search';
import { Input } from '@/components/ui/input';
import { ProfileAvatar } from '@/lib/avatars';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Collapsible label — GPU-accelerated fade + slide ── */
const labelVariants = {
  show: { opacity: 1, x: 0, filter: 'blur(0px)' },
  hide: { opacity: 0, x: -6, filter: 'blur(2px)' },
};

function SidebarLabel({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          variants={labelVariants}
          initial="hide"
          animate="show"
          exit="hide"
          transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
          className="text-[13px] font-medium overflow-hidden whitespace-nowrap will-change-[opacity,transform,filter]"
          style={{ pointerEvents: 'none' }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

const EXPANDED_W = 224;
const COLLAPSED_W = 64;

/* ── Types ── */
interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

/* ── Main Sidebar ── */
interface SidebarProps {
  onInstallClick?: () => void;
  onAuthClick?: () => void;
}

export function Sidebar({ onInstallClick, onAuthClick }: SidebarProps) {
  const view = useAppStore(s => s.view);
  const mediaFilter = useAppStore(s => s.mediaFilter);
  const { goHome, showMovies, showTvShows, showLiveTV, showAnime, showAsian, showDesi, showGames, showShowreels, showRead, showProfile, showPeople } = useAppStore();
  const authUser = useAuthStore(s => s.user);
  const authLogout = useAuthStore(s => s.logout);

  // Sidebar starts collapsed, expands on hover
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ── Search with shared hook ── */
  const {
    inputValue,
    setInputValue,
    inputRef,
    clearSearch,
  } = useSearch({
    debounceMs: 400,
    onSearchViewOpened: () => setMobileOpen(false),
  });

  /* ── Active state logic ── */
  const isSpecialView = ['search', 'movie', 'tv', 'genre', 'livetv', 'asian', 'desi', 'profile', 'showreels', 'showreel-detail', 'read', 'manga-detail', 'manga-reader', 'people', 'people-detail'].includes(view);
  const getActive = (item: NavItem): boolean => {
    if (item.key === 'home') return view === 'home' && mediaFilter === 'all' && !isSpecialView;
    if (item.key === 'movies') return view === 'home' && mediaFilter === 'movie' && !isSpecialView;
    if (item.key === 'tvshows') return view === 'home' && mediaFilter === 'tv' && !isSpecialView;
    return view === item.key;
  };

  const getActiveStyle = (item: NavItem, active: boolean): string => {
    if (active) {
      if (item.key === 'anime') return 'bg-purple-500/15 text-purple-300';
      if (item.key === 'asian') return 'bg-rose-500/15 text-rose-300';
      if (item.key === 'games') return 'bg-emerald-500/15 text-emerald-300';
      if (item.key === 'showreels') return 'bg-amber-500/15 text-amber-300';
      if (item.key === 'read') return 'bg-sky-500/15 text-sky-300';
      if (item.key === 'people') return 'bg-lime-500/15 text-lime-300';
      if (item.key === 'desi') return 'bg-orange-500/15 text-orange-300';
      return 'bg-white/10 text-white';
    }
    return 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]';
  };

  const getActiveIcon = (item: NavItem, active: boolean): string => {
    if (!active) return 'text-white/35';
    if (item.key === 'anime') return 'text-purple-400';
    if (item.key === 'asian') return 'text-rose-400';
    if (item.key === 'games') return 'text-emerald-400';
    if (item.key === 'showreels') return 'text-amber-400';
    if (item.key === 'read') return 'text-sky-400';
    if (item.key === 'people') return 'text-lime-400';
    if (item.key === 'desi') return 'text-orange-400';
    return 'text-red-500';
  };
  const navItems: NavItem[] = [
    { key: 'home', label: 'Home', icon: Home, action: goHome },
    { key: 'movies', label: 'Movies', icon: Film, action: showMovies },
    { key: 'tvshows', label: 'TV Shows', icon: Tv, action: showTvShows },
    { key: 'anime', label: 'Anime', icon: AnimeIcon, action: showAnime },
    { key: 'asian', label: 'Asian', icon: Globe, action: showAsian },
    { key: 'desi', label: 'Desi Cinema', icon: Flame, action: showDesi },
    { key: 'showreels', label: 'ShowReels', icon: Clapperboard, action: showShowreels },
    { key: 'read', label: 'Read', icon: BookOpen, action: showRead },
    { key: 'people', label: 'People', icon: Users, action: showPeople },
    { key: 'games', label: 'Games', icon: Gamepad2, action: showGames },
    { key: 'livetv', label: 'Live TV', icon: Radio, action: showLiveTV },
  ];

  const handleNavClick = (item: NavItem) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clearSearch();
    item.action();
    setMobileOpen(false);
  };

  const expanded = hovered && !mobileOpen;

  /* ── Spring config for sidebar width ── */
  const sidebarSpring = { type: 'spring' as const, stiffness: 350, damping: 30, mass: 0.8 };

  /* ── Desktop sidebar ── */
  const desktopSidebar = (
    <motion.aside
      className="hidden md:flex flex-col h-screen sticky top-0 shrink-0 border-r border-white/[0.06] bg-black/95 backdrop-blur-xl overflow-hidden will-change-[width,box-shadow]"
      animate={{
        width: expanded ? EXPANDED_W : COLLAPSED_W,
        boxShadow: expanded ? '4px 0 24px -4px rgba(0,0,0,0.5)' : '0px 0px 0px 0px rgba(0,0,0,0)',
        borderRightColor: expanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
      }}
      transition={sidebarSpring}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <div className="flex items-center h-14 shrink-0 px-3.5">
        <button onClick={goHome} className="flex items-center gap-2.5 shrink-0 group">
          <img src="/logo.png" alt="StreamVault" className="w-9 h-9 rounded-[10px] shrink-0" />
          <SidebarLabel show={expanded}>Stream<span className="text-red-500">Vault</span></SidebarLabel>
        </button>
      </div>

      {/* Search (expanded only) */}
      <div className="px-2.5 mb-1 shrink-0">
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.5 }}
              className="overflow-hidden"
              style={{ willChange: 'opacity, height' }}
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-8 h-8 bg-white/[0.06] border-white/[0.06] text-[13px] text-white placeholder:text-white/20 focus:border-red-500/40 rounded-lg"
                />
                {inputValue && (
                  <button onClick={() => { clearSearch(); goHome(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav aria-label="Main navigation" className="flex-1 px-2.5 py-1.5 space-y-0.5 overflow-y-auto content-scroll">
        {navItems.map(item => {
          const active = getActive(item);
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item)}
              title={!expanded ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 h-10 rounded-lg transition-colors duration-150 ${
                !expanded ? 'justify-center px-2' : 'px-2.5'
              } ${getActiveStyle(item, active)}`}
            >
              <item.icon className={`w-[18px] h-[18px] shrink-0 ${getActiveIcon(item, active)}`} />
              <SidebarLabel show={expanded}>{item.label}</SidebarLabel>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2.5 pb-3 shrink-0 space-y-0.5 border-t border-white/[0.06] pt-2">
        {/* Auth button */}
        {authUser ? (
          <>
            <button
              onClick={() => { showProfile(); setMobileOpen(false); }}
              title={!expanded ? `Profile (${authUser.email})` : undefined}
              className={`w-full flex items-center gap-2.5 h-10 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-white/[0.06] ${
                view === 'profile' ? '!text-red-500 !bg-red-500/10' : ''
              } ${
                !expanded ? 'justify-center px-2' : 'px-2.5'
              }`}
            >
              <span className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0">
                <ProfileAvatar slug={authUser.avatar} size={18} />
              </span>
              <SidebarLabel show={expanded}>
                <span className="flex-1 text-left truncate">{authUser.name || 'Profile'}</span>
              </SidebarLabel>
            </button>
            {expanded && (
              <button
                onClick={authLogout}
                className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-lg transition-colors text-white/25 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <SidebarLabel show={expanded}>Sign Out</SidebarLabel>
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onAuthClick}
            title={!expanded ? 'Sign In' : undefined}
            className={`w-full flex items-center gap-2.5 h-10 rounded-lg transition-colors text-white/35 hover:text-white hover:bg-white/[0.06] ${
              !expanded ? 'justify-center px-2' : 'px-2.5'
            }`}
          >
            <LogIn className="w-[18px] h-[18px] shrink-0" />
            <SidebarLabel show={expanded}>Sign In</SidebarLabel>
          </button>
        )}

        {onInstallClick && (
          <button
            onClick={onInstallClick}
            title={!expanded ? 'Install App' : undefined}
            className={`w-full flex items-center gap-2.5 h-10 rounded-lg transition-colors text-white/35 hover:text-red-400 hover:bg-red-500/10 ${
              !expanded ? 'justify-center px-2' : 'px-2.5'
            }`}
          >
            <span className="relative shrink-0">
              <Download className="w-[18px] h-[18px]" />
              <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </span>
            <SidebarLabel show={expanded}>Install App</SidebarLabel>
          </button>
        )}
      </div>
    </motion.aside>
  );

  /* ── Mobile drawer ── */
  const mobileDrawer = (
    <AnimatePresence>
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <motion.aside
            key="drawer-panel"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="md:hidden fixed left-0 top-0 bottom-0 z-[101] w-[280px] bg-zinc-950 border-r border-white/[0.08] flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between h-14 px-4 shrink-0 border-b border-white/[0.06]">
              <button onClick={goHome} className="flex items-center gap-2.5">
                <img src="/logo.png" alt="StreamVault" className="w-9 h-9 rounded-[10px]" />
                <span className="text-lg font-bold tracking-tight">Stream<span className="text-red-500">Vault</span></span>
              </button>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search movies, shows..."
                  className="pl-9 pr-9 h-9 bg-white/[0.06] border-white/[0.06] text-[13px] text-white placeholder:text-white/20 focus:border-red-500/40 rounded-lg"
                />
                {inputValue && (
                  <button onClick={() => { clearSearch(); goHome(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Nav items */}
            <nav aria-label="Main navigation" className="flex-1 px-2.5 space-y-0.5 overflow-y-auto content-scroll">
              {navItems.map(item => {
                const active = getActive(item);
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 px-3 h-11 rounded-lg transition-colors duration-150 ${getActiveStyle(item, active)}`}
                  >
                    <item.icon className={`w-[18px] h-[18px] shrink-0 ${getActiveIcon(item, active)}`} />
                    <span className="text-[13px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom */}
            <div className="px-2.5 pb-4 shrink-0 border-t border-white/[0.06] pt-2 space-y-1">
              {authUser ? (
                <button
                  onClick={() => { setMobileOpen(false); showProfile(); }}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <span className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                    <ProfileAvatar slug={authUser.avatar} size={28} />
                  </span>
                  <span className="text-[13px] font-medium flex-1 text-left truncate">{authUser.name || 'Profile'}</span>
                </button>
              ) : (
                <button
                  onClick={() => { setMobileOpen(false); onAuthClick?.(); }}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <LogIn className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-[13px] font-medium">Sign In</span>
                </button>
              )}
              {onInstallClick && (
                <button
                  onClick={() => { setMobileOpen(false); onInstallClick(); }}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <span className="relative shrink-0">
                    <Download className="w-[18px] h-[18px]" />
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </span>
                  <span className="text-[13px] font-medium">Install App</span>
                  <span className="ml-auto text-[10px] font-semibold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">NEW</span>
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  const showHamburger = !['anime', 'asian', 'desi', 'home', 'search', 'showreels', 'read'].includes(view);

  return (
    <>
      {/* Hamburger button — hidden on home/anime (they use bottom tab bar) */}
      {showHamburger && (
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-3 left-3 z-[90] w-10 h-10 rounded-xl bg-black/70 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="stroke-current" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="5" x2="15" y2="5" />
            <line x1="3" y1="9" x2="15" y2="9" />
            <line x1="3" y1="13" x2="15" y2="13" />
          </svg>
        </button>
      )}

      {desktopSidebar}
      {mobileDrawer}
    </>
  );
}

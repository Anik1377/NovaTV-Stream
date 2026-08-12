'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  Film,
  Tv,
  Home,
  Radio,
  Gamepad2,
  Download,
  Music,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Anime icon SVG ── */
function AnimeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="8 14 58 44" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M39.584 41.0606C39.6547 41.1842 39.7206 41.3128 39.7817 41.4465C39.832 41.5895 39.8765 41.7368 39.9151 41.8883C39.941 42.0474 39.96 42.2096 39.9723 42.3751C39.9702 42.5458 39.9606 42.7186 39.9435 42.8934C39.9108 43.0709 39.87 43.2492 39.8211 43.4281C39.7559 43.607 39.6823 43.7851 39.6003 43.9625C39.5016 44.1369 39.3945 44.309 39.279 44.479C39.147 44.6428 39.0068 44.803 38.8585 44.9593C38.6943 45.1066 38.5224 45.2487 38.3429 45.3855C38.1488 45.5103 37.9477 45.6284 37.7398 45.7398C37.519 45.8365 37.2923 45.9253 37.0597 46.006C36.8166 46.0695 36.5687 46.1239 36.3163 46.1692C36.0559 46.1952 35.7923 46.211 35.5255 46.2168C35.2539 46.2016 34.9806 46.1756 34.7058 46.1387C34.4296 46.0798 34.1536 46.0095 33.8777 45.928C33.604 45.8237 33.3323 45.708 33.0627 45.5808C32.799 45.4308 32.5392 45.2696 32.2833 45.097C32.0372 44.9022 31.797 44.6966 31.5625 44.4801C31.3415 44.2427 31.1282 43.9952 30.9226 43.7375C30.7341 43.4608 30.5549 43.175 30.3851 42.8803C30.2358 42.5688 30.0974 42.2497 29.9699 41.923C29.8659 41.5825 29.7741 41.2361 29.6947 40.8836C29.6412 40.521 29.6011 40.1542 29.5745 39.7833C29.5757 39.4062 29.5912 39.0269 29.621 38.6456C29.6799 38.2624 29.7537 37.8793 29.8422 37.4963C29.9606 37.116 30.094 36.7381 30.2423 36.3626C30.4205 35.9944 30.6133 35.6311 30.821 35.2726C31.0577 34.9261 31.3085 34.5867 31.5736 34.2546C31.8661 33.9391 32.1719 33.633 32.4909 33.3364C32.8351 33.0609 33.1913 32.7969 33.5593 32.5446C33.9496 32.3175 34.3502 32.1039 34.761 31.9038C35.1904 31.7327 35.628 31.5768 36.074 31.4362C36.5343 31.3277 37.0005 31.2358 37.4729 31.1605C37.9547 31.1199 38.4401 31.0969 38.929 31.0918C39.4223 31.1229 39.9165 31.1725 40.4114 31.2406C40.9053 31.3459 41.3972 31.47 41.8871 31.6129C42.3702 31.7932 42.8485 31.9921 43.3219 32.2096C43.7828 32.4638 44.236 32.736 44.6815 33.0263C45.1088 33.3517 45.5256 33.694 45.9319 34.0534C46.3145 34.4454 46.684 34.8529 47.0403 35.2759C47.3679 35.7283 47.6799 36.1942 47.9763 36.6739C48.2394 37.1787 48.4846 37.6948 48.7122 38.2224C48.9023 38.7703 49.0728 39.327 49.2238 39.8925C49.334 40.4727 49.4232 41.0589 49.4914 41.651C49.5164 42.2518 49.5194 42.8555 49.5003 43.4619C49.4364 44.0707 49.35 44.6789 49.241 45.2867C49.0865 45.8901 48.9095 46.4896 48.7098 47.0852C48.4652 47.6696 48.1983 48.2467 47.9093 48.8166C47.5767 49.3684 47.223 49.9096 46.848 50.4402C46.432 50.9461 45.9963 51.4382 45.5408 51.9165C45.0478 52.3639 44.537 52.7944 44.0084 53.208C43.4467 53.5851 42.8697 53.9426 42.2774 54.2805C41.6573 54.5767 41.0246 54.8509 40.3796 55.1032C39.7127 55.3095 39.0366 55.4919 38.3513 55.6504C37.651 55.7594 36.9449 55.8431 36.2332 55.9014C35.5137 55.9079 34.7922 55.8881 34.0688 55.8419C33.3453 55.7426 32.6237 55.6166 31.9041 55.4639C31.1923 55.2578 30.4864 55.0253 29.7864 54.7662C29.1021 54.4547 28.4277 54.1176 27.7632 53.7547C27.1222 53.3417 26.4949 52.9043 25.8812 52.4425C25.2987 51.934 24.7335 51.403 24.1855 50.8497C23.6757 50.254 23.1866 49.6384 22.7181 49.003C22.2941 48.3307 21.8937 47.6415 21.5171 46.9355C21.1904 46.1991 20.8899 45.4493 20.6157 44.6861C20.396 43.8999 20.2046 43.104 20.0415 42.2986C19.9364 41.4782 19.8611 40.6524 19.8155 39.8211C19.8303 38.9833 19.8758 38.1445 19.9518 37.3046C20.0893 36.4672 20.2576 35.6332 20.4566 34.8026C20.717 33.9836 21.0076 33.1725 21.3286 32.3694C21.7092 31.5869 22.119 30.8168 22.558 30.0592C23.0538 29.3309 23.5769 28.6195 24.1274 27.9248C24.7304 27.2678 25.3583 26.6316 26.0112 26.0163C26.7111 25.4465 27.4329 24.9012 28.1766 24.3804C28.9607 23.912 29.7631 23.4714 30.5838 23.0586C31.4373 22.7042 32.3049 22.3803 33.1869 22.0868C34.093 21.8566 35.0088 21.659 35.9345 21.494C36.875 21.3959 37.8206 21.3318 38.7711 21.3017C39.7267 21.3407 40.6824 21.4145 41.638 21.5231C42.5886 21.7016 43.5341 21.9148 44.4746 22.1629C45.3997 22.4801 46.3146 22.8314 47.2193 23.2167C48.0986 23.6689 48.9627 24.1537 49.8116 24.6711C50.6253 25.2517 51.419 25.8626 52.1927 26.5038L62.6965 16" />
      <path d="M21.094 33.0483L10 56.1608L37.1187 55.8527" />
    </svg>
  );
}

/* ── Collapsible label (declared outside render) ── */
function SidebarLabel({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.15 }}
          className="text-[13px] font-medium overflow-hidden whitespace-nowrap"
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
}

export function Sidebar({ onInstallClick }: SidebarProps) {
  const { view, mediaFilter, goHome, showMovies, showTvShows, showLiveTV, showAnime, showGames, showMusic, setSearchResults, setView, setSearchQuery } = useAppStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleCollapse = useCallback(() => {
    setCollapsed(p => !p);
  }, []);

  /* ── Search with debounce ── */
  const handleSearch = useCallback(async (query: string) => {
    setInputValue(query);
    if (!query.trim()) { goHome(); return; }
    try {
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setView('search');
      setSearchQuery(query);
    } catch { /* ignore */ }
  }, [setSearchResults, setView, setSearchQuery, goHome]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const { searchQuery } = useAppStore.getState();
    if (inputValue !== searchQuery) {
      searchTimerRef.current = setTimeout(() => handleSearch(inputValue), 500);
    }
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [inputValue, handleSearch]);

  /* ── Active state logic ── */
  const isSpecialView = ['search', 'movie', 'tv', 'genre', 'livetv'].includes(view);
  const getActive = (item: NavItem): boolean => {
    if (item.key === 'home') return view === 'home' && mediaFilter === 'all' && !isSpecialView;
    if (item.key === 'movies') return view === 'home' && mediaFilter === 'movie' && !isSpecialView;
    if (item.key === 'tvshows') return view === 'home' && mediaFilter === 'tv' && !isSpecialView;
    return view === item.key;
  };

  const getActiveStyle = (item: NavItem, active: boolean): string => {
    if (active) {
      if (item.key === 'anime') return 'bg-purple-500/15 text-purple-300';
      if (item.key === 'games') return 'bg-emerald-500/15 text-emerald-300';
      if (item.key === 'music') return 'bg-amber-500/15 text-amber-300';
      return 'bg-white/10 text-white';
    }
    return 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]';
  };

  const getActiveIcon = (item: NavItem, active: boolean): string => {
    if (!active) return 'text-white/35';
    if (item.key === 'anime') return 'text-purple-400';
    if (item.key === 'games') return 'text-emerald-400';
    if (item.key === 'music') return 'text-amber-400';
    return 'text-red-500';
  };

  /* ── Nav items ── */
  const navItems: NavItem[] = [
    { key: 'home', label: 'Home', icon: Home, action: goHome },
    { key: 'movies', label: 'Movies', icon: Film, action: showMovies },
    { key: 'tvshows', label: 'TV Shows', icon: Tv, action: showTvShows },
    { key: 'anime', label: 'Anime', icon: AnimeIcon, action: showAnime },
    { key: 'games', label: 'Games', icon: Gamepad2, action: showGames },
    { key: 'music', label: 'Music', icon: Music, action: showMusic },
    { key: 'livetv', label: 'Live TV', icon: Radio, action: showLiveTV },
  ];

  const handleNavClick = (item: NavItem) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setInputValue('');
    item.action();
    setMobileOpen(false);
  };

  const w = collapsed ? COLLAPSED_W : EXPANDED_W;
  const expanded = !collapsed;

  /* ── Desktop sidebar ── */
  const desktopSidebar = (
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0 shrink-0 border-r border-white/[0.06] bg-black/95 backdrop-blur-xl transition-[width] duration-300 ease-in-out overflow-hidden"
      style={{ width: w }}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3.5 shrink-0">
        <button onClick={goHome} className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-500 transition-colors">
            <Film className="w-5 h-5 text-white" />
          </div>
          <SidebarLabel show={expanded}>Stream<span className="text-red-500">Vault</span></SidebarLabel>
        </button>
      </div>

      {/* Search (expanded only) */}
      <div className="px-2.5 mb-1 shrink-0">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
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
                  <button onClick={() => { setInputValue(''); goHome(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2.5 py-1.5 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = getActive(item);
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 rounded-lg transition-colors duration-150 ${
                collapsed ? 'justify-center h-10' : 'px-2.5 h-10'
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
        {onInstallClick && (
          <button
            onClick={onInstallClick}
            title={collapsed ? 'Install App' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-white/35 hover:text-red-400 hover:bg-red-500/10 ${
              collapsed ? 'justify-center h-10' : 'px-2.5 h-10'
            }`}
          >
            <span className="relative shrink-0">
              <Download className="w-[18px] h-[18px]" />
              <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </span>
            <SidebarLabel show={expanded}>Install App</SidebarLabel>
          </button>
        )}
        <button
          onClick={toggleCollapse}
          title={collapsed ? 'Expand' : 'Collapse'}
          className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-white/25 hover:text-white/50 hover:bg-white/[0.04] ${
            collapsed ? 'justify-center h-10' : 'px-2.5 h-10'
          }`}
        >
          {collapsed
            ? <PanelLeftOpen className="w-[18px] h-[18px] shrink-0" />
            : <PanelLeftClose className="w-[18px] h-[18px] shrink-0" />
          }
          <SidebarLabel show={expanded}>Collapse</SidebarLabel>
        </button>
      </div>
    </aside>
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
                <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center">
                  <Film className="w-5 h-5 text-white" />
                </div>
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
                  <button onClick={() => { setInputValue(''); goHome(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto">
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
            <div className="px-2.5 pb-4 shrink-0 border-t border-white/[0.06] pt-2">
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

  return (
    <>
      {/* Mobile hamburger button */}
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

      {desktopSidebar}
      {mobileDrawer}
    </>
  );
}

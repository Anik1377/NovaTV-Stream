import { create } from 'zustand';
import type { Movie, Episode } from '@/lib/types';

type ViewType = 'home' | 'movie' | 'tv' | 'search' | 'genre' | 'livetv' | 'anime' | 'games' | 'music';
type MediaFilter = 'all' | 'movie' | 'tv';

interface AppState {
  view: ViewType;
  mediaFilter: MediaFilter;
  selectedMovie: Movie | null;
  selectedTv: Movie | null;
  searchQuery: string;
  searchResults: Movie[];
  selectedSeason: number;
  selectedEpisode: Episode | null;
  selectedGenreId: number | null;
  selectedGenreName: string;
  navCounter: number;
  selectedProvider: string;

  // Navigation history
  navHistory: ViewType[];

  // Watchlist
  watchlist: number[];

  setView: (view: ViewType) => void;
  setMediaFilter: (filter: MediaFilter) => void;
  selectMovie: (movie: Movie) => void;
  selectTv: (tv: Movie) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Movie[]) => void;
  setSelectedSeason: (season: number) => void;
  setSelectedEpisode: (episode: Episode | null) => void;
  selectGenre: (id: number, name: string) => void;
  goHome: () => void;
  showMovies: () => void;
  showTvShows: () => void;
  showLiveTV: () => void;
  showAnime: () => void;
  showGames: () => void;
  showMusic: () => void;
  bumpNav: () => void;
  setSelectedProvider: (providerId: string) => void;

  // Navigation history actions
  pushView: (view: ViewType) => void;
  goBack: () => void;

  // Watchlist actions
  toggleWatchlist: (id: number) => void;
  isInWatchlist: (id: number) => boolean;
}

const resetState = {
  selectedMovie: null,
  selectedTv: null,
  searchQuery: '',
  searchResults: [],
  selectedEpisode: null,
  selectedGenreId: null,
  selectedGenreName: '',
};

// Load watchlist from localStorage
function loadWatchlist(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('streamvault-watchlist');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

// Save watchlist to localStorage
function saveWatchlist(watchlist: number[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('streamvault-watchlist', JSON.stringify(watchlist));
  } catch {
    // ignore storage errors
  }
}

type SetFn = (fn: (state: AppState) => Partial<AppState>) => void;

function navigate(set: SetFn, view: ViewType) {
  set((s) => ({
    ...s,
    navHistory: [...s.navHistory, s.view],
    view,
  }));
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'home',
  mediaFilter: 'all',
  selectedMovie: null,
  selectedTv: null,
  searchQuery: '',
  searchResults: [],
  selectedSeason: 1,
  selectedEpisode: null,
  selectedGenreId: null,
  selectedGenreName: '',
  navCounter: 0,
  selectedProvider: 'videasy',

  // Navigation history
  navHistory: [],

  // Watchlist (loaded from localStorage on client)
  watchlist: typeof window !== 'undefined' ? loadWatchlist() : [],

  setView: (view) => set({ view }),
  setMediaFilter: (mediaFilter) => set({ view: 'home', mediaFilter, ...resetState }),

  selectMovie: (movie) => {
    navigate(set, 'movie');
    set({ selectedMovie: movie, selectedEpisode: null });
  },

  selectTv: (tv) => {
    navigate(set, 'tv');
    set({ selectedTv: tv, selectedSeason: 1, selectedEpisode: null });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSelectedSeason: (season) => set({ selectedSeason: season, selectedEpisode: null }),
  setSelectedEpisode: (episode) => set({ selectedEpisode: episode }),

  selectGenre: (id, name) => {
    navigate(set, 'genre');
    set({ selectedGenreId: id, selectedGenreName: name });
  },

  goHome: () => set({ view: 'home', mediaFilter: 'all', ...resetState, navHistory: [] }),

  showMovies: () => set({ view: 'home', mediaFilter: 'movie', ...resetState, navHistory: [] }),
  showTvShows: () => set({ view: 'home', mediaFilter: 'tv', ...resetState, navHistory: [] }),
  showLiveTV: () => set({ view: 'livetv', ...resetState, navHistory: [] }),
  showAnime: () => set({ view: 'anime', ...resetState, navHistory: [] }),
  showGames: () => set((s) => ({ view: 'games', ...resetState, navHistory: [], navCounter: s.navCounter + 1 })),
  showMusic: () => set({ view: 'music', ...resetState, navHistory: [] }),

  bumpNav: () => set((s) => ({ navCounter: s.navCounter + 1 })),
  setSelectedProvider: (providerId) => set({ selectedProvider: providerId }),

  // Navigation history actions
  pushView: (view) => {
    navigate(set, view);
  },

  goBack: () => {
    set((s) => {
      const history = [...s.navHistory];
      const prev = history.pop();
      return {
        ...s,
        navHistory: history,
        view: prev || 'home',
        ...(prev ? resetState : {}),
      };
    });
  },

  // Watchlist actions
  toggleWatchlist: (id) => {
    const current = get().watchlist;
    const updated = current.includes(id)
      ? current.filter((wid) => wid !== id)
      : [...current, id];
    set({ watchlist: updated });
    saveWatchlist(updated);
  },

  isInWatchlist: (id) => {
    return get().watchlist.includes(id);
  },
}));

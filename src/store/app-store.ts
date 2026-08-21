import { create } from 'zustand';
import type { Movie, Episode } from '@/lib/types';

/* ── Person result from search ── */
export interface SearchPerson {
  id: number;
  name: string;
  profile_path: string;
  popularity: number;
  known_for_department: string;
  known_for: {
    id: number;
    title: string;
    poster_path: string | null;
    media_type: string;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
  }[];
}

type ViewType = 'home' | 'movie' | 'tv' | 'search' | 'genre' | 'category' | 'livetv' | 'anime' | 'games' | 'asian' | 'desi' | 'showreels' | 'showreel-detail' | 'profile' | 'read' | 'manga-detail' | 'manga-reader' | 'novel-reader' | 'people' | 'people-detail' | 'warning' | 'privacy' | 'dmca';
type MediaFilter = 'all' | 'movie' | 'tv';

interface AppState {
  view: ViewType;
  mediaFilter: MediaFilter;
  selectedMovie: Movie | null;
  selectedTv: Movie | null;
  searchQuery: string;
  searchResults: Movie[];
  searchPeople: SearchPerson[];
  selectedSeason: number;
  selectedEpisode: Episode | null;
  selectedGenreId: number | null;
  selectedGenreName: string;
  selectedCategory: { genreId: number | null; title: string; mediaType: 'movie' | 'tv' | 'all'; sortBy?: string; region?: string; languages?: string } | null;
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
  setSearchPeople: (people: SearchPerson[]) => void;
  setSelectedSeason: (season: number) => void;
  setSelectedEpisode: (episode: Episode | null) => void;
  selectGenre: (id: number, name: string) => void;
  selectCategory: (genreId: number | null, title: string, mediaType: 'movie' | 'tv' | 'all', sortBy?: string, region?: string, languages?: string) => void;
  goHome: () => void;
  showMovies: () => void;
  showTvShows: () => void;
  showLiveTV: () => void;
  showAnime: () => void;
  showAsian: () => void;
  showShowreels: () => void;
  showGames: () => void;
  showSearch: () => void;
  showProfile: () => void;
  showRead: () => void;
  showPeople: () => void;
  showDesi: () => void;
  // ShowReel detail
  selectedShowreel: Movie | null;
  selectShowreel: (movie: Movie) => void;
  // Manga
  selectedManga: { id: string; title: string; coverUrl: string } | null;
  selectManga: (manga: { id: string; title: string; coverUrl: string }) => void;
  selectedChapterId: string | null;
  selectChapter: (chapterId: string) => void;
  // People
  selectedPerson: { id: number; name: string; profilePath: string | null } | null;
  selectPerson: (person: { id: number; name: string; profilePath: string | null }) => void;
  // Novel
  selectedNovel: { id: number; title: string; author: string; coverUrl: string; description?: string } | null;
  selectNovel: (novel: { id: number; title: string; author: string; coverUrl: string; description?: string }) => void;
  bumpNav: () => void;
  showWarning: () => void;
  showPrivacy: () => void;
  showDmca: () => void;
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
  selectedCategory: null,
  searchQuery: '',
  searchResults: [],
  searchPeople: [],
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
    navHistory: [...s.navHistory.slice(-49), s.view],
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
  searchPeople: [],
  selectedSeason: 1,
  selectedEpisode: null,
  selectedGenreId: null,
  selectedGenreName: '',
  selectedCategory: null,
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
  setSearchPeople: (people) => set({ searchPeople: people }),
  setSelectedSeason: (season) => set({ selectedSeason: season, selectedEpisode: null }),
  setSelectedEpisode: (episode) => set({ selectedEpisode: episode }),

  selectGenre: (id, name) => {
    navigate(set, 'genre');
    set({ selectedGenreId: id, selectedGenreName: name });
  },

  selectCategory: (genreId, title, mediaType, sortBy, region, languages) => {
    navigate(set, 'category');
    set({ selectedCategory: { genreId, title, mediaType, sortBy, region, languages } });
  },

  goHome: () => set({ view: 'home', mediaFilter: 'all', ...resetState, navHistory: [] }),

  showMovies: () => set({ view: 'home', mediaFilter: 'movie', ...resetState, navHistory: [] }),
  showTvShows: () => set({ view: 'home', mediaFilter: 'tv', ...resetState, navHistory: [] }),
  showLiveTV: () => set({ view: 'livetv', ...resetState, navHistory: [] }),
  showAnime: () => set({ view: 'anime', ...resetState, navHistory: [] }),
  showAsian: () => set({ view: 'asian', ...resetState, navHistory: [] }),
  showShowreels: () => set({ view: 'showreels', ...resetState, navHistory: [] }),
  showSearch: () => set({ view: 'search', ...resetState, navHistory: [] }),
  showProfile: () => set({ view: 'profile', ...resetState, navHistory: [] }),
  showRead: () => set({ view: 'read', ...resetState, navHistory: [] }),
  showPeople: () => set({ view: 'people', ...resetState, navHistory: [] }),
  showDesi: () => set({ view: 'desi', ...resetState, navHistory: [] }),
  showWarning: () => set({ view: 'warning', ...resetState, navHistory: [] }),
  showPrivacy: () => set({ view: 'privacy', ...resetState, navHistory: [] }),
  showDmca: () => set({ view: 'dmca', ...resetState, navHistory: [] }),
  selectedManga: null,
  selectedNovel: null,
  selectManga: (manga) => { navigate(set, 'manga-detail'); set({ selectedManga: manga }); },
  selectedChapterId: null,
  selectChapter: (chapterId) => { navigate(set, 'manga-reader'); set({ selectedChapterId: chapterId }); },
  selectNovel: (novel) => { navigate(set, 'novel-reader'); set({ selectedNovel: novel }); },
  selectedPerson: null,
  selectPerson: (person) => { navigate(set, 'people-detail'); set({ selectedPerson: person }); },
  showGames: () => set((s) => ({ view: 'games', ...resetState, navHistory: [], navCounter: s.navCounter + 1 })),
  bumpNav: () => set((s) => ({ navCounter: s.navCounter + 1 })),
  setSelectedProvider: (providerId) => set({ selectedProvider: providerId }),
  selectedShowreel: null,
  selectShowreel: (movie) => { navigate(set, 'showreel-detail'); set({ selectedShowreel: movie }); },

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

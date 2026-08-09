import { create } from 'zustand';
import type { Movie, Episode } from '@/lib/types';

type ViewType = 'home' | 'movie' | 'tv' | 'search' | 'genre';

interface AppState {
  view: ViewType;
  selectedMovie: Movie | null;
  selectedTv: Movie | null;
  searchQuery: string;
  searchResults: Movie[];
  selectedSeason: number;
  selectedEpisode: Episode | null;
  selectedGenreId: number | null;
  selectedGenreName: string;

  setView: (view: ViewType) => void;
  selectMovie: (movie: Movie) => void;
  selectTv: (tv: Movie) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Movie[]) => void;
  setSelectedSeason: (season: number) => void;
  setSelectedEpisode: (episode: Episode | null) => void;
  selectGenre: (id: number, name: string) => void;
  goHome: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'home',
  selectedMovie: null,
  selectedTv: null,
  searchQuery: '',
  searchResults: [],
  selectedSeason: 1,
  selectedEpisode: null,
  selectedGenreId: null,
  selectedGenreName: '',

  setView: (view) => set({ view }),
  selectMovie: (movie) => set({ view: 'movie', selectedMovie: movie, selectedEpisode: null }),
  selectTv: (tv) => set({ view: 'tv', selectedTv: tv, selectedSeason: 1, selectedEpisode: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSelectedSeason: (season) => set({ selectedSeason: season, selectedEpisode: null }),
  setSelectedEpisode: (episode) => set({ selectedEpisode: episode }),
  selectGenre: (id, name) => set({ view: 'genre', selectedGenreId: id, selectedGenreName: name }),
  goHome: () => set({ view: 'home', selectedMovie: null, selectedTv: null, searchQuery: '', searchResults: [], selectedEpisode: null }),
}));

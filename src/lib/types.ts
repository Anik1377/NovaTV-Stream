export interface Movie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
  popularity: number;
  adult: boolean;
  original_language: string;
  original_title?: string;
  original_name?: string;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status: string;
  tagline?: string;
  production_companies: { id: number; name: string; logo_path: string | null }[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  similar?: { results: Movie[] };
  videos?: { results: Video[] };
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  overview: string;
  poster_path: string | null;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

export interface SeasonDetails {
  id: number;
  name: string;
  season_number: number;
  episodes: Episode[];
}

export interface TvShowDetails extends MovieDetails {
  seasons: Season[];
  last_episode_to_air?: Episode;
  next_episode_to_air?: Episode;
  created_by: { id: number; name: string; profile_path: string | null }[];
}

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  known_for_department: string;
  known_for?: Movie[];
  gender?: number;
  adult?: boolean;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  gender: number;
  popularity: number;
  known_for_department: string;
  homepage: string | null;
  also_known_as: string[];
  movie_credits?: {
    cast: PersonCastCredit[];
    crew: PersonCrewCredit[];
  };
  tv_credits?: {
    cast: PersonCastCredit[];
    crew: PersonCrewCredit[];
  };
  images?: {
    profiles: { file_path: string; aspect_ratio: number; vote_average: number }[];
  };
}

export interface PersonCastCredit {
  id: number;
  title?: string;
  name?: string;
  character: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  popularity: number;
  media_type?: 'movie' | 'tv';
  episode_count?: number;
}

export interface PersonCrewCredit {
  id: number;
  title?: string;
  name?: string;
  job: string;
  department: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  popularity: number;
  media_type?: 'movie' | 'tv';
}

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface SearchResult {
  results: Movie[];
  total_results: number;
  total_pages: number;
  page: number;
}

export type MediaType = 'movie' | 'show';
export type WatchStatus = 'watching' | 'completed' | 'plan_to_watch' | 'dropped';

export type WatchItem = {
  id: string;
  title: string;
  type: MediaType;
  status: WatchStatus;
  currentEpisode: number | null;
  totalEpisodes: number | null;
  season: number | null;
  tmdbId?: string | null;
  tmdbPosterPath?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface WatchlistItem {
  id: string;
  title: string;
  type: MediaType;
  status: WatchStatus;
  currentEpisode?: number;
  totalEpisodes?: number;
  season?: number;
  tmdbId?: string;
  tmdbPosterPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
}

export interface TMDBItemDetails {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
}

export interface WatchlistFormData {
  title: string;
  type: MediaType;
  status: WatchStatus;
  currentEpisode?: number | null;
  totalEpisodes?: number | null;
  season?: number | null;
  tmdbId?: string | null;
  tmdbPosterPath?: string | null;
}
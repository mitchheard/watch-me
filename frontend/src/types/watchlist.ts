export type MediaType = 'movie' | 'show';
export type WatchStatus = 'watching' | 'completed' | 'plan_to_watch' | 'dropped';

export type WatchItem = {
  id: number;
  title: string;
  type: string;
  status: string;
  currentSeason: number | null;
  totalSeasons: number | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  notes: string | null;
  rating: number | null;
  tmdbId: number | null;
  tmdbImdbId: string | null;
  tmdbMovieCertification: string | null;
  tmdbMovieReleaseYear: number | null;
  tmdbMovieRuntime: number | null;
  tmdbOverview: string | null;
  tmdbPosterPath: string | null;
  tmdbTagline: string | null;
  tmdbTvCertification: string | null;
  tmdbTvFirstAirYear: number | null;
  tmdbTvLastAirYear: number | null;
  tmdbTvNetworks: string | null;
  tmdbTvNumberOfEpisodes: number | null;
  tmdbTvNumberOfSeasons: number | null;
  tmdbTvStatus: string | null;
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
  notes?: string;
  rating?: number;
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
  type: string;
  status: string;
  currentSeason?: number | null;
  totalSeasons?: number | null;
  notes?: string | null;
  rating?: number | null;
  tmdbId?: number | null;
  tmdbImdbId?: string | null;
  tmdbMovieCertification?: string | null;
  tmdbMovieReleaseYear?: number | null;
  tmdbMovieRuntime?: number | null;
  tmdbOverview?: string | null;
  tmdbPosterPath?: string | null;
  tmdbTagline?: string | null;
  tmdbTvCertification?: string | null;
  tmdbTvFirstAirYear?: number | null;
  tmdbTvLastAirYear?: number | null;
  tmdbTvNetworks?: string | null;
  tmdbTvNumberOfEpisodes?: number | null;
  tmdbTvNumberOfSeasons?: number | null;
  tmdbTvStatus?: string | null;
}
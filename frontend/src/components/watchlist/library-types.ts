export type LibraryItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  rating: string | null;
  notes: string | null;
  createdAt: string;
  tmdbPosterPath: string | null;
  tmdbOverview: string | null;
  tmdbMovieReleaseYear: number | null;
  tmdbTvFirstAirYear: number | null;
  tmdbMovieRuntime: number | null;
  tmdbMovieCertification: string | null;
  tmdbTvCertification: string | null;
};

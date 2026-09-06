const TMDB_IMAGE = 'https://image.tmdb.org/t/p';

export type TmdbPosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780';

/** Absolute TMDB poster URL, or null when the path is missing. */
export function tmdbPosterUrl(
  posterPath: string | null | undefined,
  size: TmdbPosterSize = 'w342'
): string | null {
  if (!posterPath) return null;
  const path = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;
  return `${TMDB_IMAGE}/${size}${path}`;
}

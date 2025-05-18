import { TMDB } from 'tmdb-ts';
import { NextResponse } from 'next/server';

// Helper function to extract year from a date string (YYYY-MM-DD)
function getYear(dateString?: string): number | null {
  if (!dateString) return null;
  const year = parseInt(dateString.split('-')[0], 10);
  return isNaN(year) ? null : year;
}

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB API key is not configured.' }, { status: 500 });
  }
  const tmdb = new TMDB(apiKey);

  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdbId');
  const type = searchParams.get('type'); // 'movie' or 'tv'

  if (!tmdbId || !type || (type !== 'movie' && type !== 'tv')) {
    return NextResponse.json({ error: 'tmdbId and type (movie/tv) are required.' }, { status: 400 });
  }

  const id = parseInt(tmdbId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid tmdbId.' }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let details: any = {};
    let certification: string | null = null;
    let imdbId: string | null = null;

    if (type === 'movie') {
      const movieDetails = await tmdb.movies.details(id);
      const releaseDates = await tmdb.movies.releaseDates(id);
      const externalIds = await tmdb.movies.externalIds(id);

      // Find US certification
      const usRelease = releaseDates.results.find(r => r.iso_3166_1 === 'US');
      certification = usRelease?.release_dates.find(rd => rd.certification !== '')?.certification || null;
      
      imdbId = externalIds.imdb_id || null;

      details = {
        tmdbId: movieDetails.id,
        tmdbPosterPath: movieDetails.poster_path,
        tmdbOverview: movieDetails.overview,
        tmdbTagline: movieDetails.tagline,
        tmdbImdbId: imdbId,
        tmdbMovieRuntime: movieDetails.runtime,
        tmdbMovieReleaseYear: getYear(movieDetails.release_date),
        tmdbMovieCertification: certification,
        // TV specific fields will be null or undefined
      };
    } else if (type === 'tv') {
      const tvDetails = await tmdb.tvShows.details(id);
      const contentRatings = await tmdb.tvShows.contentRatings(id);
      const externalIds = await tmdb.tvShows.externalIds(id);

      // Find US certification for TV
      const usRating = contentRatings.results.find(r => r.iso_3166_1 === 'US');
      certification = usRating?.rating || null;

      imdbId = externalIds.imdb_id || null;

      details = {
        tmdbId: tvDetails.id,
        tmdbPosterPath: tvDetails.poster_path,
        tmdbOverview: tvDetails.overview,
        tmdbTagline: tvDetails.tagline,
        tmdbImdbId: imdbId,
        tmdbTvFirstAirYear: getYear(tvDetails.first_air_date),
        tmdbTvLastAirYear: getYear(tvDetails.last_air_date),
        tmdbTvNetworks: tvDetails.networks?.map(n => n.name).join(', ') || null,
        tmdbTvNumberOfEpisodes: tvDetails.number_of_episodes,
        tmdbTvNumberOfSeasons: tvDetails.number_of_seasons,
        tmdbTvStatus: tvDetails.status,
        tmdbTvCertification: certification,
        // Movie specific fields will be null or undefined
      };
    }

    return NextResponse.json(details);

  } catch (error) {
    console.error(`Error fetching TMDB ${type} details for id ${id}:`, error);
    let errorMessage = 'Failed to fetch data from TMDB.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Consider checking error structure for TMDB specific messages if available
    // For example, if (error.response && error.response.data && error.response.data.status_message)
    if (typeof error === 'object' && error !== null && 'status_message' in error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorMessage = (error as any).status_message;
    }
    return NextResponse.json({ error: `Failed to fetch TMDB ${type} details.`, details: errorMessage }, { status: 500 });
  }
} 
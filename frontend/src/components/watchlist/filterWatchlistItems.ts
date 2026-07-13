export type WatchlistFilterType = 'all' | 'movie' | 'show';
export type WatchlistFilterStatus = 'all' | 'want-to-watch' | 'watching' | 'finished';

export type FilterableWatchItem = {
  title: string;
  type: string;
  status: string;
  createdAt: Date | string;
};

export type WatchlistFilters = {
  type: WatchlistFilterType;
  status: WatchlistFilterStatus;
  searchQuery?: string;
};

/**
 * Client-side filter for the in-memory watchlist: type, status, and
 * case-insensitive title substring. Newest-first by createdAt.
 */
export function filterWatchlistItems<T extends FilterableWatchItem>(
  items: T[],
  { type, status, searchQuery = '' }: WatchlistFilters,
): T[] {
  const query = searchQuery.trim().toLowerCase();

  return items
    .filter((item) => type === 'all' || item.type === type)
    .filter((item) => status === 'all' || item.status === status)
    .filter((item) => !query || item.title.toLowerCase().includes(query))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

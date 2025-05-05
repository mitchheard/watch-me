export interface WatchItem {
    id: number;
    title: string;
    type: 'movie' | 'show';
    status: 'want-to-watch' | 'watching' | 'finished';
    currentSeason?: number | null;
    totalSeasons?: number | null;
    createdAt: string;
  }
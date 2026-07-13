import { describe, expect, it } from 'vitest';
import { filterWatchlistItems } from './filterWatchlistItems';

function item(
  overrides: Partial<{
    id: number;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  }> = {},
) {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Title',
    type: overrides.type ?? 'movie',
    status: overrides.status ?? 'want-to-watch',
    createdAt: overrides.createdAt ?? '2026-01-02T00:00:00.000Z',
  };
}

const items = [
  item({ id: 1, title: 'The Beef', type: 'show', status: 'want-to-watch', createdAt: '2026-01-03T00:00:00.000Z' }),
  item({ id: 2, title: 'Beef Wellington', type: 'movie', status: 'watching', createdAt: '2026-01-02T00:00:00.000Z' }),
  item({ id: 3, title: 'Succession', type: 'show', status: 'finished', createdAt: '2026-01-01T00:00:00.000Z' }),
  item({ id: 4, title: 'Inception', type: 'movie', status: 'want-to-watch', createdAt: '2025-12-31T00:00:00.000Z' }),
];

describe('filterWatchlistItems', () => {
  it('returns all items newest-first when type and status are all and search is empty', () => {
    const result = filterWatchlistItems(items, {
      type: 'all',
      status: 'all',
      searchQuery: '',
    });
    expect(result.map((i) => i.id)).toEqual([1, 2, 3, 4]);
  });

  it('filters by case-insensitive title substring', () => {
    const result = filterWatchlistItems(items, {
      type: 'all',
      status: 'all',
      searchQuery: 'BEEF',
    });
    expect(result.map((i) => i.title)).toEqual(['The Beef', 'Beef Wellington']);
  });

  it('trims search query whitespace', () => {
    const result = filterWatchlistItems(items, {
      type: 'all',
      status: 'all',
      searchQuery: '  beef  ',
    });
    expect(result).toHaveLength(2);
  });

  it('composes search with type filter', () => {
    const result = filterWatchlistItems(items, {
      type: 'show',
      status: 'all',
      searchQuery: 'beef',
    });
    expect(result.map((i) => i.title)).toEqual(['The Beef']);
  });

  it('composes search with status filter', () => {
    const result = filterWatchlistItems(items, {
      type: 'all',
      status: 'watching',
      searchQuery: 'beef',
    });
    expect(result.map((i) => i.title)).toEqual(['Beef Wellington']);
  });

  it('composes search with both type and status filters', () => {
    const result = filterWatchlistItems(items, {
      type: 'movie',
      status: 'want-to-watch',
      searchQuery: 'incept',
    });
    expect(result.map((i) => i.title)).toEqual(['Inception']);
  });

  it('returns empty array when no titles match', () => {
    const result = filterWatchlistItems(items, {
      type: 'all',
      status: 'all',
      searchQuery: 'zzzzz',
    });
    expect(result).toEqual([]);
  });

  it('treats missing searchQuery as no title filter', () => {
    const result = filterWatchlistItems(items, {
      type: 'movie',
      status: 'all',
    });
    expect(result.map((i) => i.id)).toEqual([2, 4]);
  });
});

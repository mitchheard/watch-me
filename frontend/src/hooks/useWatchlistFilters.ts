'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type FilterType = 'all' | 'movie' | 'show';
export type FilterStatus = 'all' | 'want-to-watch' | 'watching' | 'finished';

const VALID_TYPES: FilterType[] = ['all', 'movie', 'show'];
const VALID_STATUSES: FilterStatus[] = ['all', 'want-to-watch', 'watching', 'finished'];

export default function useWatchlistFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [type, setType] = useState<FilterType>('all');
  const [status, setStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    const rawType = searchParams.get('type');
    const rawStatus = searchParams.get('status');

    const parsedType = VALID_TYPES.includes(rawType as FilterType)
      ? (rawType as FilterType)
      : 'all';

    const parsedStatus = VALID_STATUSES.includes(rawStatus as FilterStatus)
      ? (rawStatus as FilterStatus)
      : 'all';

    setType(parsedType);
    setStatus(parsedStatus);
  }, [searchParams]);

  const updateFilters = (newType: FilterType, newStatus: FilterStatus) => {
    const params = new URLSearchParams();
    if (newType !== 'all') params.set('type', newType);
    if (newStatus !== 'all') params.set('status', newStatus);
    router.push(`?${params.toString()}`);
  };

  return {
    type,
    status,
    updateFilters,
  };
}

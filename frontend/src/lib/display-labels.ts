export function formatPickMeta(opts: {
  year: number | null;
  type: string;
  runtimeMinutes: number | null;
}): string {
  const bits: string[] = [];
  if (opts.year) bits.push(String(opts.year));
  bits.push(opts.type === 'movie' ? 'Movie' : 'TV');
  if (opts.runtimeMinutes && opts.runtimeMinutes > 0) {
    bits.push(`${opts.runtimeMinutes} min`);
  }
  return bits.join(' · ');
}

export function formatAddedDate(iso: string | Date | null | undefined): string | null {
  if (!iso) return null;
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function ratingLabel(rating: string | null | undefined): string | null {
  if (rating === 'loved') return 'Loved';
  if (rating === 'liked') return 'Liked';
  if (rating === 'not-for-me') return "Wasn't for me";
  return null;
}

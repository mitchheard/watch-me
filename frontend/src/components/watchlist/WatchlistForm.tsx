'use client';

import { useState } from 'react';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { WatchItem } from '@/types/watchlist';

export default function WatchlistForm({ onAddItem }: { onAddItem: () => void }) {
  const [form, setForm] = useState<Omit<WatchItem, 'id' | 'createdAt'>>({
    title: '',
    type: 'movie',
    status: 'want-to-watch',
    currentSeason: null,
    totalSeasons: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      currentSeason: form.currentSeason ? Number(form.currentSeason) : null,
      totalSeasons: form.totalSeasons ? Number(form.totalSeasons) : null,
    };

    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSuccess(true);
      setForm({
        title: '',
        type: 'movie',
        status: 'want-to-watch',
        currentSeason: null,
        totalSeasons: null,
      });
      onAddItem();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      console.error('Failed to add item');
    }

    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm w-full mx-auto">
      {success && (
        <div className="text-green-600 text-sm font-medium text-center">
          Added to your watchlist!
        </div>
      )}

      <FormInput
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        required
      />

      <FormSelect
        name="type"
        value={form.type}
        onChange={handleChange}
        options={[
          { value: 'movie', label: 'Movie' },
          { value: 'show', label: 'TV Show' },
        ]}
      />

      <FormSelect
        name="status"
        value={form.status}
        onChange={handleChange}
        options={[
          { value: 'want-to-watch', label: 'Want to Watch' },
          { value: 'watching', label: 'Watching' },
          { value: 'finished', label: 'Finished' },
        ]}
      />

      {form.type === 'show' && (
        <>
          <FormInput
            type="number"
            name="currentSeason"
            value={form.currentSeason ?? ''}
            onChange={handleChange}
            placeholder="Current Season (optional)"
          />
          <FormInput
            type="number"
            name="totalSeasons"
            value={form.totalSeasons ?? ''}
            onChange={handleChange}
            placeholder="Total Seasons (optional)"
          />
        </>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Add to Watchlist'}
      </button>
    </form>
  );
}

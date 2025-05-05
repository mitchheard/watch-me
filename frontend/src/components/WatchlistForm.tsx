'use client';

import { useState } from 'react';

export default function WatchlistForm({ onAddItem }: { onAddItem: () => void }) {
  const [form, setForm] = useState({
    title: '',
    type: 'movie',
    status: 'want-to-watch',
    currentSeason: '',
    totalSeasons: '',
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
      currentSeason: form.currentSeason ? parseInt(form.currentSeason) : null,
      totalSeasons: form.totalSeasons ? parseInt(form.totalSeasons) : null,
    };

    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.ok) {
      setSuccess(true);
      setForm({
        title: '',
        type: 'movie',
        status: 'want-to-watch',
        currentSeason: '',
        totalSeasons: '',
      });
      onAddItem();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      console.error('Submission failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto w-full">
      {success && (
        <div className="text-green-600 text-sm font-medium text-center">
          Added to your watchlist!
        </div>
      )}

      <input
        type="text"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        className="border px-3 py-2 rounded w-full"
        required
      />

      <select
        name="type"
        value={form.type}
        onChange={handleChange}
        className="border px-3 py-2 rounded w-full"
      >
        <option value="movie">Movie</option>
        <option value="show">TV Show</option>
      </select>

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
        className="border px-3 py-2 rounded w-full"
      >
        <option value="want-to-watch">Want to Watch</option>
        <option value="watching">Watching</option>
        <option value="finished">Finished</option>
      </select>

      {form.type === 'show' && (
        <>
          <input
            type="number"
            name="currentSeason"
            value={form.currentSeason}
            onChange={handleChange}
            placeholder="Current Season (optional)"
            className="border px-3 py-2 rounded w-full"
          />

          <input
            type="number"
            name="totalSeasons"
            value={form.totalSeasons}
            onChange={handleChange}
            placeholder="Total Seasons (optional)"
            className="border px-3 py-2 rounded w-full"
          />
        </>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={`py-2 px-4 rounded transition-colors ${
          submitting
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {submitting ? 'Adding...' : 'Add to Watchlist'}
      </button>
    </form>
  );
}

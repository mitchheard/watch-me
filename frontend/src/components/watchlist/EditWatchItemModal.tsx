'use client';

import { useState } from 'react';
import { WatchItem } from '@/types/watchlist';
import Modal from '../Modal';

interface Props {
  item: WatchItem;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditWatchItemModal({ item, onClose, onUpdate }: Props) {
  const [form, setForm] = useState({
    title: item.title,
    type: item.type,
    status: item.status,
    currentSeason: item.currentSeason?.toString() || '',
    totalSeasons: item.totalSeasons?.toString() || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      id: item.id,
      currentSeason: form.currentSeason ? parseInt(form.currentSeason) : null,
      totalSeasons: form.totalSeasons ? parseInt(form.totalSeasons) : null,
    };

    const res = await fetch('/api/watchlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) {
      onUpdate();
    } else {
      console.error('Update failed');
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">Edit Watchlist Item</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
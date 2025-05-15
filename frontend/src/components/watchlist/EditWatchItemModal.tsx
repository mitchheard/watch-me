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

    try {
    const res = await fetch('/api/watchlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
        onUpdate(); // Refresh the list
        onClose();  // Close the modal
    } else {
        // Consider adding user-facing error feedback here
        console.error('Update failed', await res.text());
    }
    } catch (error) {
      // Handle network errors or other exceptions
      console.error('An error occurred during update:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reverted inputBaseClass to light-theme only
  const inputBaseClass = "border border-slate-300 px-3 py-2 rounded-md w-full text-sm bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow";

  return (
    <Modal onClose={onClose} title="Edit Watchlist Item">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="title" className="block text-xs font-medium text-slate-600 mb-1">Title</label>
        <input
            id="title"
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
            placeholder="e.g., The Matrix"
            className={inputBaseClass}
          required
        />
        </div>

        <div>
          <label htmlFor="type" className="block text-xs font-medium text-slate-600 mb-1">Type</label>
        <select
            id="type"
          name="type"
          value={form.type}
          onChange={handleChange}
            className={`${inputBaseClass} appearance-none`}
        >
          <option value="movie">Movie</option>
          <option value="show">TV Show</option>
        </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-xs font-medium text-slate-600 mb-1">Status</label>
        <select
            id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
            className={`${inputBaseClass} appearance-none`}
        >
          <option value="want-to-watch">Want to Watch</option>
          <option value="watching">Watching</option>
          <option value="finished">Finished</option>
        </select>
        </div>

        {form.type === 'show' && (
          <>
            <div>
              <label htmlFor="currentSeason" className="block text-xs font-medium text-slate-600 mb-1">Current Season</label>
            <input
                id="currentSeason"
              type="number"
              name="currentSeason"
              value={form.currentSeason}
              onChange={handleChange}
                placeholder="e.g., 1 (optional)"
                className={inputBaseClass}
            />
            </div>
            <div>
              <label htmlFor="totalSeasons" className="block text-xs font-medium text-slate-600 mb-1">Total Seasons</label>
            <input
                id="totalSeasons"
              type="number"
              name="totalSeasons"
              value={form.totalSeasons}
              onChange={handleChange}
                placeholder="e.g., 3 (optional)"
                className={inputBaseClass}
            />
            </div>
          </>
        )}

        <div className="flex justify-end items-center gap-3 mt-6 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-600 bg-white border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
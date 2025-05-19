'use client';

import { useState } from 'react';
import { WatchItem } from '@/types/watchlist';
import Modal from '../Modal';

interface Props {
  item: WatchItem;
  onClose: () => void;
  onUpdate: () => void;
}

const inputBaseClass = "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

export default function EditWatchItemModal({ item, onClose, onUpdate }: Props) {
  const [form, setForm] = useState({
    title: item.title,
    type: item.type,
    status: item.status,
    currentSeason: item.currentSeason?.toString() || '',
    totalSeasons: item.totalSeasons?.toString() || '',
    notes: item.notes || '',
    rating: item.rating?.toString() || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: Partial<WatchItem> & { id: number } = {
      ...item,
      id: item.id,
      title: form.title,
      type: form.type,
      status: form.status,
      currentSeason: form.currentSeason ? parseInt(form.currentSeason) : null,
      totalSeasons: form.totalSeasons ? parseInt(form.totalSeasons) : null,
      notes: form.notes || null,
      rating: form.rating ? parseInt(form.rating) : null,
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
        console.error('Update failed', await res.text());
      }
    } catch (error) {
      console.error('An error occurred during update:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Edit Watchlist Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-xs font-medium text-slate-600 mb-1">Title</label>
          <input
            id="title"
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className={inputBaseClass}
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
            required
            className={inputBaseClass}
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
            required
            className={inputBaseClass}
          >
            <option value="plan_to_watch">Plan to Watch</option>
            <option value="watching">Currently Watching</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
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

        <div>
          <label htmlFor="rating" className="block text-xs font-medium text-slate-600 mb-1">Your Rating (1-5)</label>
          <input
            id="rating"
            type="number"
            name="rating"
            value={form.rating}
            onChange={handleChange}
            placeholder="e.g., 4 (optional)"
            min="1"
            max="5"
            className={inputBaseClass}
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="e.g., Rewatch with friends, amazing soundtrack... (optional)"
            className={inputBaseClass}
          />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
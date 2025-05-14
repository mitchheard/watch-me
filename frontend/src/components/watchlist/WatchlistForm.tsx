'use client';

import { useState, useEffect, useRef } from 'react';
import FormInput from '../forms/FormInput';
import FormSelect from '../forms/FormSelect';
import { WatchItem } from '@/types/watchlist';

// Define a more specific type for the form state if WatchItem includes id/createdAt
type WatchlistFormState = Omit<WatchItem, 'id' | 'createdAt'>;

export default function WatchlistForm({ onAddItem, itemToEdit, onUpdateItem, onCancelEdit }: { 
  onAddItem: (newItem: WatchItem) => void,
  itemToEdit?: WatchItem, 
  onUpdateItem?: (item: WatchItem) => void, 
  onCancelEdit?: () => void 
}) {
  const initialFormState: WatchlistFormState = {
    title: '',
    type: 'movie',
    status: 'want-to-watch',
    currentSeason: null,
    totalSeasons: null,
  };
  const [form, setForm] = useState<WatchlistFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!itemToEdit && titleInputRef.current) {
      titleInputRef.current.focus();
    }
    // If itemToEdit changes, reset the form fields
    setForm(prevForm => ({
      ...prevForm,
      title: itemToEdit?.title || '',
      type: itemToEdit?.type || 'movie',
      status: itemToEdit?.status || 'want-to-watch',
      currentSeason: itemToEdit?.currentSeason || null,
      totalSeasons: itemToEdit?.totalSeasons || null,
    }));
    setSuccessMessage(null);
    setError(null);
  }, [itemToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: name === 'currentSeason' || name === 'totalSeasons' 
              ? (value === '' ? null : Number(value)) 
              : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setError(null); // Clear previous errors

    const currentSeasonNum = form.currentSeason ? Number(form.currentSeason) : null;
    const totalSeasonsNum = form.totalSeasons ? Number(form.totalSeasons) : null;

    // Validate only if a value is present and it's not a valid number
    if (form.currentSeason !== null && isNaN(currentSeasonNum as number)) {
      setError("Current season must be a valid number.");
      setSubmitting(false);
      return;
    }
    if (form.totalSeasons !== null && isNaN(totalSeasonsNum as number)) {
      setError("Total seasons must be a valid number.");
      setSubmitting(false);
      return;
    }

    const payload = {
      ...form,
      currentSeason: form.type === 'show' ? currentSeasonNum : null,
      totalSeasons: form.type === 'show' ? totalSeasonsNum : null,
    };

    try {
      let response;
      if (itemToEdit) {
        response = await fetch(`/api/watchlist?id=${itemToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (itemToEdit && onUpdateItem) {
          onUpdateItem(result);
          setSuccessMessage('Item updated successfully!');
        } else if (onAddItem) {
          onAddItem(result);
          setSuccessMessage('Item added successfully!');
          setForm(initialFormState);
          titleInputRef.current?.focus();
        }
        setTimeout(() => { setSuccessMessage(null); setError(null); }, 4000);
      } else {
        const errorData = await response.text();
        setError(`Error: ${errorData || (itemToEdit ? 'Failed to update item' : 'Failed to add item')}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex flex-col gap-4 w-full"
    >
      {/* Title is now part of the modal content, not inside WatchlistForm itself often */}
      {/* <h2 className="text-xl font-semibold text-slate-700 mb-1 text-center">Add New Item</h2> */}
      
      {successMessage && (
        <div className="p-3 rounded-md text-sm font-medium text-center mb-2 bg-green-50 text-green-700 border border-green-200">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-md text-sm font-medium text-center mb-2 bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <FormInput
        id="title"
        name="title"
        label="Title"
        value={form.title}
        onChange={handleChange}
        placeholder="e.g., Dune: Part Two"
        required
        ref={titleInputRef}
        className="py-3 text-base"
      />

      <FormSelect
        id="type"
        name="type"
        label="Type"
        value={form.type}
        onChange={handleChange}
        options={[
          { value: 'movie', label: 'Movie' },
          { value: 'show', label: 'TV Show' },
        ]}
      />

      <FormSelect
        id="status"
        name="status"
        label="Status"
        value={form.status}
        onChange={handleChange}
        options={[
          { value: 'want-to-watch', label: 'Want to Watch' },
          { value: 'watching', label: 'Watching' },
          { value: 'finished', label: 'Finished' },
        ]}
      />

      {form.type === 'show' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            id="currentSeason"
            type="number"
            name="currentSeason"
            label="Current Season"
            value={form.currentSeason ?? ''}
            onChange={handleChange}
            placeholder="e.g., 1 (optional)"
            min="0"
          />
          <FormInput
            id="totalSeasons"
            type="number"
            name="totalSeasons"
            label="Total Seasons"
            value={form.totalSeasons ?? ''}
            onChange={handleChange}
            placeholder="e.g., 3 (optional)"
            min="0"
          />
        </div>
      )}

      <div className={`flex gap-3 pt-4 ${itemToEdit ? 'justify-end' : 'justify-start'} border-t border-slate-200 mt-6`}>
        {itemToEdit && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {submitting ? (itemToEdit ? 'Saving...': 'Adding...') : (itemToEdit ? 'Update Item' : 'Add to Watchlist')}
        </button>
      </div>
    </form>
  );
}

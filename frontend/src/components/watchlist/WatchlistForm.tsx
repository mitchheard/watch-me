'use client';

import { useState, useEffect, useRef } from 'react';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { WatchItem } from '@/types/watchlist';

// Define a more specific type for the form state if WatchItem includes id/createdAt
type WatchlistFormState = Omit<WatchItem, 'id' | 'createdAt'>;

export default function WatchlistForm({ onAddItem }: { onAddItem: () => void }) {
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
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus the title input on component mount
    titleInputRef.current?.focus();
  }, []);

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

    // Ensure currentSeason and totalSeasons are numbers or null
    const payload = {
      ...form,
      currentSeason: form.currentSeason ? Number(form.currentSeason) : null,
      totalSeasons: form.totalSeasons ? Number(form.totalSeasons) : null,
    };

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMessage('Successfully added to your watchlist!');
        setForm(initialFormState); // Reset form
        titleInputRef.current?.focus(); // Re-focus title input for next entry
        onAddItem(); // Callback to refresh list or handle success
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        const errorData = await res.text();
        console.error('Failed to add item:', errorData);
        setSuccessMessage(`Error: ${errorData || 'Failed to add item'}`);
        setTimeout(() => setSuccessMessage(null), 5000); 
      }
    } catch (error) {
      console.error('An error occurred:', error);
      setSuccessMessage('An unexpected error occurred.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Removed padding, bg, shadow, and mb from form tag as modal provides it.
    // Reduced gap from gap-5 to gap-4.
    <form 
      onSubmit={handleSubmit} 
      className="flex flex-col gap-4 w-full"
    >
      {/* Title is now part of the modal content, not inside WatchlistForm itself often */}
      {/* <h2 className="text-xl font-semibold text-slate-700 mb-1 text-center">Add New Item</h2> */}
      
      {successMessage && (
        <div 
          className={`p-3 rounded-md text-sm font-medium text-center mb-2 ${
            successMessage.startsWith('Error:') 
              ? 'bg-red-50 text-red-700' 
              : 'bg-green-50 text-green-700'
          }`}
        >
          {successMessage}
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
        ref={titleInputRef} // Assign ref for autofocus
        className="py-3 text-base" // Retain larger size for title input
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
        // Reduced gap for season inputs as well if a specific grid gap was there
        // (It was gap-5 implicitly from the parent form, now it's gap-4)
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            id="currentSeason"
            type="number"
            name="currentSeason"
            label="Current Season"
            value={form.currentSeason ?? ''} // Handle null for input value
            onChange={handleChange}
            placeholder="e.g., 1 (optional)"
            min="0"
          />
          <FormInput
            id="totalSeasons"
            type="number"
            name="totalSeasons"
            label="Total Seasons"
            value={form.totalSeasons ?? ''} // Handle null for input value
            onChange={handleChange}
            placeholder="e.g., 3 (optional)"
            min="0"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 mt-2"
      >
        {submitting ? 'Adding...' : 'Add to Watchlist'}
      </button>
    </form>
  );
}

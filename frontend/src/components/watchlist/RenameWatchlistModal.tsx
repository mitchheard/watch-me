'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import Modal from '@/components/Modal';

interface RenameWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (newName: string) => Promise<void>;
}

export default function RenameWatchlistModal({ 
  isOpen, 
  onClose, 
  currentName, 
  onRename 
}: RenameWatchlistModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === currentName) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename(newName.trim());
      onClose();
    } catch (error) {
      console.error('Failed to rename watchlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewName(currentName);
    onClose();
  };

  return (
    <Modal onClose={handleClose} title="Rename Watchlist">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="watchlist-name" className="block text-sm font-medium text-gray-700 mb-2">
            Watchlist Name
          </label>
          <input
            type="text"
            id="watchlist-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter watchlist name"
            autoFocus
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !newName.trim() || newName.trim() === currentName}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Renaming...' : 'Rename'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

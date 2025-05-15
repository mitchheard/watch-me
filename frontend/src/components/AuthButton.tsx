'use client';

import { useState } from 'react';
// Don't import useAuth unless window is defined

export function AuthButton() {
  // If we're on a static page (SSR, like 404), just show a simple sign in button
  if (typeof window === 'undefined') {
    return (
      <button
        onClick={() => { window.location.href = '/'; }}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Sign In
      </button>
    );
  }

  // Only import/use useAuth on the client
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useAuth } = require('@/contexts/AuthContext');
  const { user, login, logout, isLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <button 
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        disabled
      >
        Loading...
      </button>
    );
  }

  if (user) {
    return (
      <button
        onClick={() => logout()}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Sign Out
      </button>
    );
  }

  if (isModalOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-center">Sign In</h2>
          <button
            onClick={() => login()}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Continue with GitHub
          </button>
          <button
            onClick={() => setIsModalOpen(false)}
            className="w-full px-4 py-2 mt-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsModalOpen(true)}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
    >
      Sign In
    </button>
  );
} 
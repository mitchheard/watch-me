'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ShareIcon, EyeIcon, MagnifyingGlassIcon, FilmIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import CreateWatchlistModal from './CreateWatchlistModal';
import RenameWatchlistModal from './RenameWatchlistModal';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  isShared: boolean;
  isDefault: boolean;
  owner: {
    id: string;
    email: string;
  };
  members: Array<{
    user: {
      id: string;
      email: string;
    };
  }>;
  _count: {
    items: number;
  };
}

interface WatchlistManagerProps {
  className?: string;
}

export default function WatchlistManager({ className = '' }: WatchlistManagerProps) {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const showSharedOnly = searchParams.get('shared') === 'true';
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [watchlistToRename, setWatchlistToRename] = useState<Watchlist | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchWatchlists();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError('Please log in to view your watchlists');
    }
  }, [authLoading, user]);


  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlists');
      if (!response.ok) {
        throw new Error('Failed to fetch watchlists');
      }
      const data = await response.json();
      setWatchlists(data.watchlists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchWatchlists(); // Refresh the list
  };

  // Filter watchlists based on search criteria
  const filteredWatchlists = watchlists.filter(watchlist => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      watchlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (watchlist.description && watchlist.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // URL-based filter (for shared lists page)
    const matchesUrlFilter = !showSharedOnly || watchlist.isShared;
    
    return matchesSearch && matchesUrlFilter;
  });

  const handleDeleteWatchlist = async (watchlistId: string) => {
    if (!confirm('Are you sure you want to delete this watchlist? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/watchlists/${watchlistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete watchlist');
      }

      setWatchlists(watchlists.filter(w => w.id !== watchlistId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete watchlist');
    }
  };

  const handleShareWatchlist = async (watchlist: Watchlist) => {
    // TODO: Implement sharing functionality
    console.log('Share watchlist:', watchlist);
    alert('Sharing functionality coming soon!');
  };

  const handleRenameWatchlist = async (newName: string) => {
    if (!watchlistToRename) return;

    try {
      const response = await fetch(`/api/watchlists/${watchlistToRename.id}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename watchlist');
      }

      // Update the watchlist in the local state
      setWatchlists(watchlists.map(w => 
        w.id === watchlistToRename.id 
          ? { ...w, name: newName }
          : w
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename watchlist');
      throw err;
    }
  };

  const openRenameModal = (watchlist: Watchlist, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWatchlistToRename(watchlist);
    setShowRenameModal(true);
  };

  if (authLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error: {error}
      </div>
    );
  }

  return (
    <>
      <div className={"space-y-2 sm:space-y-3 " + className}>
      {/* Header */}
      {showSharedOnly && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Shared Lists
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Lists shared with friends and family
          </p>
        </div>
      )}

      {/* Search Controls */}
      {!showSharedOnly && (
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search watchlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* New Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
          >
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        </div>
      )}

      {/* Watchlists Grid */}
      <div className="grid gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredWatchlists.map((watchlist) => (
          <Link
            key={watchlist.id}
            href={`/watchlists/${watchlist.id}?name=${encodeURIComponent(watchlist.name)}`}
            className="group relative p-2 bg-white border border-gray-200 rounded hover:border-gray-300 hover:shadow-sm transition-all duration-200 block"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-semibold text-gray-900 truncate text-sm">
                    {watchlist.name}
                  </h3>
                  {watchlist.isShared && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <ShareIcon className="h-2.5 w-2.5 mr-0.5" />
                      Shared
                    </span>
                  )}
                  {watchlist.isDefault && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Default
                    </span>
                  )}
                </div>
                
                {watchlist.description && (
                  <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                    {watchlist.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Stats and Owner in one line */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <FilmIcon className="h-3 w-3" />
                  {watchlist._count.items} items
                </span>
                {watchlist.isShared && (
                  <span className="flex items-center gap-0.5">
                    <ShareIcon className="h-3 w-3" />
                    {watchlist.members.length} members
                  </span>
                )}
              </div>
              <span className="text-gray-400">
                by {watchlist.owner.email.split('@')[0]}
              </span>
            </div>

            {/* Actions Menu */}
            <div className="absolute top-2 right-2">
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <MenuButton
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex justify-center w-full rounded-md bg-white px-1 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm border border-gray-200"
                  >
                    <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
                  </MenuButton>
                </div>

                <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={(e) => openRenameModal(watchlist, e)}
                            className={classNames(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                              'block px-4 py-2 text-sm w-full text-left'
                            )}
                          >
                            <div className="flex items-center">
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Rename
                            </div>
                          </button>
                        )}
                      </MenuItem>
                      
                      {watchlist.isShared && (
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleShareWatchlist(watchlist);
                              }}
                              className={classNames(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'block px-4 py-2 text-sm w-full text-left'
                              )}
                            >
                              <div className="flex items-center">
                                <ShareIcon className="h-4 w-4 mr-2" />
                                Share
                              </div>
                            </button>
                          )}
                        </MenuItem>
                      )}
                      
                      {!watchlist.isDefault && (
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteWatchlist(watchlist.id);
                              }}
                              className={classNames(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'block px-4 py-2 text-sm w-full text-left text-red-600'
                              )}
                            >
                              <div className="flex items-center">
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
                              </div>
                            </button>
                          )}
                        </MenuItem>
                      )}
                      
                      {watchlist.isShared && (
                        <MenuItem disabled>
                          {({ active }) => (
                            <button
                              className={classNames(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'block px-4 py-2 text-sm w-full text-left opacity-50 cursor-not-allowed'
                              )}
                            >
                              <div className="flex items-center">
                                <EyeIcon className="h-4 w-4 mr-2" />
                                Remove Myself (Coming Soon)
                              </div>
                            </button>
                          )}
                        </MenuItem>
                      )}
                    </div>
                </MenuItems>
                </Menu>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredWatchlists.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FilmIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery 
              ? 'No watchlists match your search' 
              : showSharedOnly 
                ? 'No shared lists yet' 
                : 'No watchlists yet'
            }
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search criteria'
              : showSharedOnly
                ? 'Create a shared list to collaborate with friends and family'
                : 'Create your first watchlist to start organizing your movies and TV shows'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              {showSharedOnly ? 'Create Shared List' : 'Create Your First List'}
            </button>
          )}
        </div>
      )}

      {/* Create Watchlist Modal */}
      <CreateWatchlistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Rename Watchlist Modal */}
      {watchlistToRename && (
        <RenameWatchlistModal
          isOpen={showRenameModal}
          onClose={() => {
            setShowRenameModal(false);
            setWatchlistToRename(null);
          }}
          currentName={watchlistToRename.name}
          onRename={handleRenameWatchlist}
        />
      )}
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ShareIcon, EyeIcon, MagnifyingGlassIcon, FilmIcon, EllipsisVerticalIcon, UserPlusIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import CreateWatchlistModal from './CreateWatchlistModal';
import RenameWatchlistModal from './RenameWatchlistModal';
import AddMemberModal from './AddMemberModal';
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
  ownerId: string;
  createdAt: string;
  updatedAt: string;
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
  const [hasMounted, setHasMounted] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [watchlistToAddMember, setWatchlistToAddMember] = useState<Watchlist | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  useEffect(() => {
    if (!authLoading && user) {
      // Only fetch if we haven't fetched recently (within 30 seconds)
      const now = Date.now();
      if (now - lastFetchTime > 30000) {
        fetchWatchlists();
      }
    } else if (!authLoading && !user) {
      setLoading(false);
      setError('Please log in to view your watchlists');
    }
  }, [user, authLoading, showSharedOnly]); // Removed lastFetchTime from dependencies to prevent unnecessary re-runs

  const fetchWatchlists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/watchlists');
      if (!response.ok) {
        throw new Error('Failed to fetch watchlists');
      }
      const data = await response.json();
      // Handle the response format: { watchlists: [...] }
      const watchlistsArray = data.watchlists || data;
      setWatchlists(Array.isArray(watchlistsArray) ? watchlistsArray : []);
      setLastFetchTime(Date.now()); // Update the last fetch time
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlists');
      setWatchlists([]); // Ensure watchlists is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchWatchlists();
  };

  const filteredWatchlists = Array.isArray(watchlists) ? watchlists.filter((watchlist) => {
    const matchesSearch =
      watchlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (watchlist.description && watchlist.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // URL-based filter (for shared lists page)
    const matchesUrlFilter = !showSharedOnly || watchlist.isShared;
    
    return matchesSearch && matchesUrlFilter;
  }) : [];

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

      setWatchlists(Array.isArray(watchlists) ? watchlists.filter(w => w.id !== watchlistId) : []);
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
      setWatchlists(Array.isArray(watchlists) ? watchlists.map(w => 
        w.id === watchlistToRename.id 
          ? { ...w, name: newName }
          : w
      ) : []);
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

  const openAddMemberModal = (watchlist: Watchlist, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWatchlistToAddMember(watchlist);
    setShowAddMemberModal(true);
  };


  if (!hasMounted) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>Please log in to manage your watchlists.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
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
      <div className="text-red-600 text-sm">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
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
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* New List Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
          >
            <PlusIcon className="h-4 w-4 mr-1" /> New
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
            {/* Three-dot menu */}
            <div className="absolute top-2 right-2">
              <Menu as="div" className="relative inline-block text-left">
                <MenuButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="inline-flex justify-center w-full rounded-md bg-white px-1 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm border border-gray-200"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
                </MenuButton>
                
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openRenameModal(watchlist, e);
                            }}
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } group flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <PencilIcon className="mr-3 h-4 w-4" aria-hidden="true" />
                            Rename
                          </button>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // TODO: Implement public link sharing
                              alert('Public link sharing coming soon!');
                            }}
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } group flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <LinkIcon className="mr-3 h-4 w-4" aria-hidden="true" />
                            Share as Public Link
                          </button>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={(e) => openAddMemberModal(watchlist, e)}
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } group flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <UserPlusIcon className="mr-3 h-4 w-4" aria-hidden="true" />
                            Add Member
                          </button>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // TODO: Implement delete functionality
                              alert('Delete functionality coming soon!');
                            }}
                            className={`${
                              active ? 'bg-gray-100 text-red-600' : 'text-red-600'
                            } group flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <TrashIcon className="mr-3 h-4 w-4" aria-hidden="true" />
                            Delete
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0 pr-8">
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
            
            {/* Item count - moved to separate line */}
            <div className="mb-2">
              <span className="text-gray-400 text-xs">
                {watchlist._count.items} items
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">
                  by {watchlist.owner.email.split('@')[0]}
                </span>
                {watchlist.isShared && (
                  <span className="flex items-center gap-0.5">
                    <ShareIcon className="h-3 w-3" />
                    {watchlist.members.length} members
                  </span>
                )}
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
          <p className="text-sm text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search or filters.' 
              : showSharedOnly 
                ? 'Shared lists will appear here when you join or create one.' 
                : 'Create your first watchlist to get started!'
            }
          </p>
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

      {/* Add Member Modal */}
      {watchlistToAddMember && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => {
            setShowAddMemberModal(false);
            setWatchlistToAddMember(null);
          }}
          watchlistId={watchlistToAddMember.id}
          watchlistName={watchlistToAddMember.name}
          onSuccess={() => {
            // Refresh the watchlists to show updated member count
            fetchWatchlists();
          }}
        />
      )}
    </div>
  );
}
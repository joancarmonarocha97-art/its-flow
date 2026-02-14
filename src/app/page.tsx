
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskListView } from '@/components/TaskListView';
import { TaskCalendarView } from '@/components/TaskCalendarView';
import { TeamWorkloadView } from '@/components/TeamWorkloadView';
import { LayoutGrid, List, Calendar, Users, Search, Filter } from 'lucide-react';
import { clsx } from 'clsx';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { ProfileSettingsModal } from '@/components/ProfileSettingsModal';

export default function Home() {
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar' | 'team'>('board');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Global Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleProfileUpdated = () => {
    router.refresh(); // Refresh to show new avatar
    // Ideally we might want to refresh the session or user context here if it doesn't auto-update
    window.location.reload(); // Hard reload to force avatar update if needed
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4 md:gap-8">
          <h1 className="text-lg md:text-xl font-bold text-blue-600 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1 rounded">IF</span>
            <span className="hidden md:inline">ITS Flow</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Search Bar - Hidden on mobile for now to save space */}
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="pl-9 pr-4 py-1.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 rounded-md text-sm w-40 md:w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

          {/* Real User Profile */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-700">{user.user_metadata.full_name || user.email}</span>
                <span className="text-xs text-gray-500 capitalize">{user.user_metadata.role || 'technician'}</span>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-100 border border-blue-200 overflow-hidden">
                <img
                  src={user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  className="w-full h-full object-cover"
                  alt="avatar"
                />
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden p-2 md:p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4 md:mb-6 gap-2 overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-1 md:gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
            <button
              onClick={() => setViewMode('board')}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'board' ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'list' ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <List size={16} />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'calendar' ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('team')}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'team' ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Users size={16} />
              <span className="hidden sm:inline">Team</span>
            </button>
          </div>

          {/* Context Action: My Tasks Toggle */}
          <button
            onClick={() => setMyTasksOnly(!myTasksOnly)}
            className={clsx(
              "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border flex-shrink-0 whitespace-nowrap",
              myTasksOnly
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            <Filter size={16} />
            {myTasksOnly ? 'My Tasks' : <span className="hidden sm:inline">All Tasks</span>}
            {!myTasksOnly && <span className="sm:hidden">All</span>}
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {viewMode === 'board' && (
            <KanbanBoard
              searchQuery={searchQuery}
              myTasksOnly={myTasksOnly}
              currentUserId={user.id}
            />
          )}
          {viewMode === 'list' && (
            <TaskListView
              searchQuery={searchQuery}
              myTasksOnly={myTasksOnly}
              currentUserId={user.id}
            />
          )}
          {viewMode === 'calendar' && (
            <TaskCalendarView
              searchQuery={searchQuery}
              myTasksOnly={myTasksOnly}
              currentUserId={user.id}
            />
          )}
          {viewMode === 'team' && <TeamWorkloadView />}
        </div>
      </div>

      <ProfileSettingsModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </main>
  );
}

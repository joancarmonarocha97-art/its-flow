
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task, TaskColumn, Profile } from '@/types';
import { EditTaskPanel } from './EditTaskPanel';
import { CreateTaskModal } from './CreateTaskModal';
import { clsx } from 'clsx';
import { Calendar, User, ArrowUpDown, Filter } from 'lucide-react';

interface TaskListViewProps {
    searchQuery: string;
    myTasksOnly: boolean;
    currentUserId: string | null;
}

export function TaskListView({ searchQuery, myTasksOnly, currentUserId }: TaskListViewProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [columns, setColumns] = useState<TaskColumn[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: keyof Task; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setIsLoading(true);
        const { data: cols } = await supabase.from('task_columns').select('*').order('position');
        const { data: tks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        const { data: pros } = await supabase.from('profiles').select('*');

        if (cols) setColumns(cols);
        if (tks) setTasks(tks);

        const profileMap: Record<string, Profile> = {};
        pros?.forEach(p => profileMap[p.id] = p);
        setProfiles(profileMap);
        setIsLoading(false);
    }

    const handleSort = (key: keyof Task) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUser = myTasksOnly ? task.assignee_id === currentUserId : true;
        return matchesSearch && matchesUser;
    });

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        if (a[key] === null) return 1;
        if (b[key] === null) return -1;
        if (a[key]! < b[key]!) return direction === 'asc' ? -1 : 1;
        if (a[key]! > b[key]!) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const priorityColor = (p: string) => ({
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-orange-100 text-orange-800',
        critical: 'bg-red-100 text-red-800',
    }[p] || 'bg-gray-100 text-gray-800');

    const statusColor = (colId: string) => {
        const col = columns.find(c => c.id === colId);
        if (!col) return 'bg-gray-100 text-gray-800';
        // Just simple coloring based on title for now
        if (col.title === 'Terminado') return 'bg-emerald-100 text-emerald-800';
        if (col.title === 'En curso') return 'bg-blue-100 text-blue-800';
        if (col.title === 'Revisión') return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header / Toolbar */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Filter size={14} /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <ArrowUpDown size={14} /> Sort
                    </button>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    + New Task
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('title')}>Task Name</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('priority')}>Priority</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('column_id')}>Status</th>
                            <th className="px-6 py-3">Assignee</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('due_date')}>Due Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedTasks.map(task => (
                            <tr
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                            >
                                <td className="px-6 py-3 font-medium text-gray-900">{task.title}</td>
                                <td className="px-6 py-3">
                                    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", priorityColor(task.priority))}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", statusColor(task.column_id))}>
                                        {columns.find(c => c.id === task.column_id)?.title || 'Unknown'}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    {task.assignee_id && profiles[task.assignee_id] ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                {profiles[task.assignee_id].avatar_url ? (
                                                    <img src={profiles[task.assignee_id].avatar_url!} className="w-full h-full rounded-full" />
                                                ) : (
                                                    profiles[task.assignee_id].full_name?.[0]
                                                )}
                                            </div>
                                            <span className="text-gray-600">{profiles[task.assignee_id].full_name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-gray-500">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                        {sortedTasks.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No tasks found. Create one to get started!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTaskCreated={fetchData}
                profiles={Object.values(profiles)}
                columns={columns}
            />

            <EditTaskPanel
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onTaskUpdated={fetchData}
                profiles={Object.values(profiles)}
                columns={columns}
            />
        </div>
    );
}

"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task, TaskColumn, Profile } from '@/types';
import { EditTaskPanel } from './EditTaskPanel';
import { CreateTaskModal } from './CreateTaskModal';
import { clsx } from 'clsx';
import { Calendar, User, ArrowUpDown, Filter, ArrowDown, ArrowUp, Trash2 } from 'lucide-react';

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
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_120px_150px_120px_50px] gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-500">
                <div onClick={() => handleSort('title')} className="cursor-pointer hover:text-gray-700 flex items-center gap-1">
                    Task Name {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
                <div onClick={() => handleSort('priority')} className="cursor-pointer hover:text-gray-700 flex items-center gap-1">
                    Priority {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
                <div onClick={() => handleSort('column_id')} className="cursor-pointer hover:text-gray-700 flex items-center gap-1">
                    Status {sortConfig.key === 'column_id' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
                <div onClick={() => handleSort('assignee_id')} className="cursor-pointer hover:text-gray-700 flex items-center gap-1">
                    Assignee {sortConfig.key === 'assignee_id' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
                <div onClick={() => handleSort('due_date')} className="cursor-pointer hover:text-gray-700 flex items-center gap-1">
                    Due Date {sortConfig.key === 'due_date' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
                <div></div> {/* Actions Column */}
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto">
                {sortedTasks.map((task) => {
                    const assignee = task.assignee_id ? profiles[task.assignee_id] : null;
                    const column = columns.find(c => c.id === task.column_id);

                    return (
                        <div
                            key={task.id}
                            className="grid grid-cols-[1fr_120px_120px_150px_120px_50px] gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center group cursor-pointer"
                            onClick={() => setSelectedTask(task)}
                        >
                            <div className="font-medium text-gray-900 truncate pr-4">{task.title}</div>

                            <div>
                                <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", priorityColor(task.priority))}>
                                    {task.priority}
                                </span>
                            </div>

                            <div>
                                <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium", statusColor(task.column_id))}>
                                    {column?.title || 'Unknown'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {assignee ? (
                                    <>
                                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                            <img
                                                src={assignee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.id}`} // Use ID as seed if email is missing
                                                alt={assignee.full_name || ''}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 truncate">{assignee.full_name || 'User'}</span>
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Unassigned</span>
                                )}
                            </div>

                            <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar size={14} />
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTask(task.id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete task"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {sortedTasks.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <p>No tasks found</p>
                    </div>
                )}
            </div>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTaskCreated={fetchData}
                profiles={Object.values(profiles)}
                columns={columns}
            />

            {/* Edit Panel */}
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

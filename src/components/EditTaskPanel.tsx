
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task, Profile, TaskColumn } from '@/types';
import { X, Trash2, Save, Calendar, User, Tag } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onTaskUpdated: () => void;
    profiles: Profile[];
    columns: TaskColumn[];
}

export function EditTaskPanel({ task, isOpen, onClose, onTaskUpdated, profiles, columns }: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [columnId, setColumnId] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setColumnId(task.column_id);
            setAssigneeId(task.assignee_id || '');
            setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
        }
    }, [task]);

    if (!isOpen || !task) return null;

    async function handleSave() {
        if (!task) return;
        setLoading(true);

        const { error } = await supabase.from('tasks').update({
            title,
            description,
            priority,
            column_id: columnId,
            assignee_id: assigneeId || null,
            due_date: dueDate || null,
            updated_at: new Date().toISOString(),
        }).eq('id', task.id);

        setLoading(false);
        if (!error) {
            onTaskUpdated();
            onClose();
        } else {
            console.error(error);
            alert('Error updating task');
        }
    }

    async function handleDelete() {
        if (!task || !confirm('Are you sure you want to delete this task?')) return;
        setLoading(true);

        const { error } = await supabase.from('tasks').delete().eq('id', task.id);

        setLoading(false);
        if (!error) {
            onTaskUpdated();
            onClose();
        } else {
            console.error(error);
            alert('Error deleting task');
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <span>{columns.find(c => c.id === columnId)?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDelete}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Task"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {/* Title */}
                    <div>
                        <input
                            type="text"
                            className="w-full text-2xl font-bold text-gray-900 bg-white border-none focus:ring-0 p-0 placeholder-gray-300"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Task Title"
                        />
                    </div>

                    {/* Properties Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="flex flex-col gap-1">
                            <span className="text-gray-500 flex items-center gap-2"><Tag size={14} /> Priority</span>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value as any)}
                                className="bg-transparent font-medium text-gray-800 focus:ring-blue-500 border-gray-200 rounded-md py-1"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-gray-500 flex items-center gap-2"><User size={14} /> Assignee</span>
                            <select
                                value={assigneeId}
                                onChange={e => setAssigneeId(e.target.value)}
                                className="bg-transparent font-medium text-gray-800 focus:ring-blue-500 border-gray-200 rounded-md py-1"
                            >
                                <option value="">Unassigned</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-gray-500 flex items-center gap-2"><Calendar size={14} /> Due Date</span>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="bg-transparent font-medium text-gray-800 focus:ring-blue-500 border-gray-200 rounded-md py-1"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-gray-500 flex items-center gap-2">Status</span>
                            <select
                                value={columnId}
                                onChange={e => setColumnId(e.target.value)}
                                className="bg-transparent font-medium text-gray-800 focus:ring-blue-500 border-gray-200 rounded-md py-1"
                            >
                                {columns.map(col => (
                                    <option key={col.id} value={col.id}>{col.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">Description</label>
                        <textarea
                            className="w-full min-h-[150px] p-3 text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add more details to this task..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </>
    );
}


"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task, Profile, TaskColumn } from '@/types';
import { Users, AlertCircle, CheckCircle2, Clock, Briefcase } from 'lucide-react';
import { clsx } from 'clsx';

export function TeamWorkloadView() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [columns, setColumns] = useState<TaskColumn[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const { data: pros } = await supabase.from('profiles').select('*');
        const { data: tks } = await supabase.from('tasks').select('*');
        const { data: cols } = await supabase.from('task_columns').select('*');

        if (pros) setProfiles(pros);
        if (tks) setTasks(tks);
        if (cols) setColumns(cols);
        setLoading(false);
    }

    const getMemberStats = (memberId: string) => {
        const memberTasks = tasks.filter(t => t.assignee_id === memberId);
        const total = memberTasks.length;

        // Status counts
        const completedCol = columns.find(c => c.title === 'Terminado')?.id;
        const completed = memberTasks.filter(t => t.column_id === completedCol).length;
        const active = total - completed;

        // Priority counts
        const critical = memberTasks.filter(t => t.priority === 'critical' && t.column_id !== completedCol).length;
        const high = memberTasks.filter(t => t.priority === 'high' && t.column_id !== completedCol).length;

        return { total, active, completed, critical, high, tasks: memberTasks };
    };

    const unassignedTasks = tasks.filter(t => !t.assignee_id);

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <Users size={20} />
                    Team Workload
                </h2>
                <div className="text-sm text-gray-500">
                    {profiles.length} Team Members
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Team Members Cards */}
                    {profiles.map(member => {
                        const stats = getMemberStats(member.id);
                        return (
                            <div key={member.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                member.full_name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{member.full_name}</h3>
                                            <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                        </div>
                                    </div>
                                    <div className={clsx(
                                        "px-2 py-1 rounded-full text-xs font-semibold",
                                        stats.active > 5 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                    )}>
                                        {stats.active} Active
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                                        <span className="block text-lg font-bold text-gray-800">{stats.total}</span>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total</span>
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded-lg text-center">
                                        <span className="block text-lg font-bold text-orange-700">{stats.high + stats.critical}</span>
                                        <span className="text-[10px] text-orange-600 uppercase tracking-wide">High Prio</span>
                                    </div>
                                    <div className="bg-emerald-50 p-2 rounded-lg text-center">
                                        <span className="block text-lg font-bold text-emerald-700">{stats.completed}</span>
                                        <span className="text-[10px] text-emerald-600 uppercase tracking-wide">Done</span>
                                    </div>
                                </div>

                                {/* Recent Tasks */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase">Current Tasks</h4>
                                    {stats.tasks.filter(t => t.column_id !== columns.find(c => c.title === 'Terminado')?.id).slice(0, 3).map(task => (
                                        <div key={task.id} className="text-sm p-2 bg-gray-50 rounded border border-gray-100 flex items-center justify-between">
                                            <span className="truncate flex-1 pr-2">{task.title}</span>
                                            <span className={clsx(
                                                "w-2 h-2 rounded-full",
                                                task.priority === 'critical' ? 'bg-red-500' :
                                                    task.priority === 'high' ? 'bg-orange-400' :
                                                        task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                            )} title={task.priority} />
                                        </div>
                                    ))}
                                    {stats.active === 0 && (
                                        <div className="text-sm text-gray-400 italic text-center py-2">No active tasks</div>
                                    )}
                                    {stats.active > 3 && (
                                        <div className="text-xs text-center text-blue-600 cursor-pointer hover:underline">
                                            + {stats.active - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Unassigned Card */}
                    {unassignedTasks.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 border-l-4 border-l-yellow-400">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Unassigned</h3>
                                    <p className="text-xs text-gray-500">Tasks needing attention</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {unassignedTasks.slice(0, 5).map(task => (
                                    <div key={task.id} className="text-sm p-2 bg-yellow-50 rounded border border-yellow-100 flex items-center justify-between">
                                        <span className="truncate flex-1 pr-2">{task.title}</span>
                                        <span className={clsx(
                                            "w-2 h-2 rounded-full",
                                            task.priority === 'critical' ? 'bg-red-500' :
                                                task.priority === 'high' ? 'bg-orange-400' :
                                                    task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                        )} title={task.priority} />
                                    </div>
                                ))}
                                <div className="text-xs text-center text-yellow-700 font-medium">
                                    {unassignedTasks.length} unassigned tasks total
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

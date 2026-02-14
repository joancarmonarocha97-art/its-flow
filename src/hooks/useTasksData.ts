import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task, TaskColumn, Profile } from '@/types';

export function useTasksData(searchQuery: string = '', myTasksOnly: boolean = false, currentUserId: string | null = null) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [columns, setColumns] = useState<TaskColumn[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [isLoading, setIsLoading] = useState(true);

    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        fetchData();

        console.log('Setting up Supabase Realtime subscription...');

        const tasksSubscription = supabase
            .channel('tasks_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                console.log('Realtime change received (tasks):', payload);
                if (payload.eventType === 'INSERT') {
                    setTasks((prev) => [payload.new as Task, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setTasks((prev) => prev.map((task) => (task.id === payload.new.id ? (payload.new as Task) : task)));
                } else if (payload.eventType === 'DELETE') {
                    setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
                }
            })
            .subscribe((status, error) => {
                console.log('Tasks subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                } else {
                    setIsConnected(false);
                }

                if (error) {
                    console.error('Tasks subscription error:', error);
                }
            });

        const columnsSubscription = supabase
            .channel('columns_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_columns' }, (payload) => {
                console.log('Realtime change received (columns):', payload);
                if (payload.eventType === 'INSERT') {
                    setColumns((prev) => [...prev, payload.new as TaskColumn].sort((a, b) => a.position - b.position));
                } else if (payload.eventType === 'UPDATE') {
                    setColumns((prev) => prev.map((col) => (col.id === payload.new.id ? (payload.new as TaskColumn) : col)).sort((a, b) => a.position - b.position));
                } else if (payload.eventType === 'DELETE') {
                    setColumns((prev) => prev.filter((col) => col.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            console.log('Cleaning up subscriptions...');
            tasksSubscription.unsubscribe();
            columnsSubscription.unsubscribe();
        };
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

    // Filter tasks based on search query and user filter
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUser = myTasksOnly ? task.assignee_id === currentUserId : true;
        return matchesSearch && matchesUser;
    });

    return {
        tasks,
        columns,
        profiles,
        isLoading,
        filteredTasks,
        refresh: fetchData,
        isConnected
    };
}

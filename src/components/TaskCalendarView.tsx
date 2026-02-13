
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task, TaskColumn, Profile } from '@/types';
import { EditTaskPanel } from './EditTaskPanel';
import { CreateTaskModal } from './CreateTaskModal';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    resource: Task;
}

interface TaskCalendarViewProps {
    searchQuery: string;
    myTasksOnly: boolean;
    currentUserId: string | null;
}

export function TaskCalendarView({ searchQuery, myTasksOnly, currentUserId }: TaskCalendarViewProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [columns, setColumns] = useState<TaskColumn[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Derived state for events
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    // Re-calculate events when tasks or filters change
    useEffect(() => {
        const filteredTasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesUser = myTasksOnly ? task.assignee_id === currentUserId : true;
            return matchesSearch && matchesUser;
        });

        const mappedEvents = filteredTasks
            .filter(t => t.due_date)
            .map(t => ({
                id: t.id,
                title: t.title,
                start: new Date(t.due_date!),
                end: new Date(t.due_date!),
                allDay: true,
                resource: t,
            }));
        setEvents(mappedEvents);
    }, [tasks, searchQuery, myTasksOnly, currentUserId]);

    async function fetchData() {
        const { data: cols } = await supabase.from('task_columns').select('*').order('position');
        const { data: tks } = await supabase.from('tasks').select('*');
        const { data: pros } = await supabase.from('profiles').select('*');

        if (cols) setColumns(cols);
        if (tks) setTasks(tks);

        const profileMap: Record<string, Profile> = {};
        pros?.forEach(p => profileMap[p.id] = p);
        setProfiles(profileMap);
    }


    const priorityColor = (p: string) => ({
        low: '#dcfce7', // green-100
        medium: '#fef9c3', // yellow-100
        high: '#ffedd5', // orange-100
        critical: '#fee2e2', // red-100
    }[p] || '#f3f4f6');

    const priorityTextColor = (p: string) => ({
        low: '#166534', // green-800
        medium: '#854d0e', // yellow-800
        high: '#9a3412', // orange-800
        critical: '#991b1b', // red-800
    }[p] || '#1f2937');

    const eventStyleGetter = (event: CalendarEvent) => {
        const backgroundColor = priorityColor(event.resource.priority);
        const color = priorityTextColor(event.resource.priority);
        return {
            style: {
                backgroundColor,
                color,
                borderRadius: '4px',
                border: 'none',
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '500',
                padding: '2px 6px',
            }
        };
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header / Toolbar */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <CalendarIcon size={20} />
                    Calendar
                </h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    + New Task
                </button>
            </div>

            {/* Calendar */}
            <div className="flex-1 p-4">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 'calc(100vh - 250px)' }}
                    views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
                    defaultView={Views.MONTH}
                    onSelectEvent={(event) => setSelectedTask(event.resource)}
                    eventPropGetter={eventStyleGetter}
                    components={{
                        toolbar: CustomToolbar
                    }}
                />
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

// Simple Custom Toolbar
const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        toolbar.onNavigate('TODAY');
    };

    return (
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <button onClick={goToBack} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <span className="text-lg font-bold text-gray-800 capitalize min-w-[150px] text-center">
                    {format(toolbar.date, 'MMMM yyyy')}
                </span>
                <button onClick={goToNext} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronRight size={20} className="text-gray-600" />
                </button>
            </div>

            <div className="flex gap-2">
                <button onClick={goToCurrent} className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200">
                    Today
                </button>
                <div className="flex bg-gray-100 rounded-md p-0.5">
                    {['month', 'week', 'agenda'].map(view => (
                        <button
                            key={view}
                            onClick={() => toolbar.onView(view)}
                            className={`px-3 py-1 text-sm font-medium rounded-md capitalize ${toolbar.view === view ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {view}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

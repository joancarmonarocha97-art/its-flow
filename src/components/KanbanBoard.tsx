
"use client";

import { useEffect, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor,
    closestCorners
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskColumn, Profile } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { createPortal } from 'react-dom';

import { EditTaskPanel } from './EditTaskPanel';

interface KanbanBoardProps {
    searchQuery: string;
    myTasksOnly: boolean;
    currentUserId: string | null;
}

export function KanbanBoard({ searchQuery, myTasksOnly, currentUserId }: KanbanBoardProps) {
    const [columns, setColumns] = useState<TaskColumn[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

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

    function handleTaskCreated() {
        fetchData();
    }

    function handleTaskClick(task: Task) {
        setSelectedTask(task);
    }

    async function handleDeleteTask(taskId: string) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Error deleting task');
        }
    }

    function handleDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === 'Task') {
            setActiveTask(event.active.data.current.task);
        }
    }

    async function handleDragEnd(event: DragEndEvent) {
        setActiveTask(null);
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        // const isOverTask = over.data.current?.type === 'Task'; // Unused

        if (!isActiveTask) return;

        // Find the task objects
        const activeTaskIndex = tasks.findIndex(t => t.id === activeId);
        const activeTask = tasks[activeTaskIndex];

        // Check if we dropped over a column or another task
        const isOverColumn = over.data.current?.type === 'Column';

        let newColumnId = activeTask.column_id;

        if (isOverColumn) {
            newColumnId = over.id as string;
        } else {
            // Dropped over a task, find its column
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newColumnId = overTask.column_id;
            }
        }

        if (activeTask.column_id !== newColumnId) {
            // Moved to another column
            const updatedTasks = tasks.map(t => {
                if (t.id === activeId) return { ...t, column_id: newColumnId };
                return t;
            });
            setTasks(updatedTasks);

            // Update in DB
            await supabase.from('tasks').update({ column_id: newColumnId }).eq('id', activeId);
        }
    }

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUser = myTasksOnly ? task.assignee_id === currentUserId : true;
        return matchesSearch && matchesUser;
    });

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 px-4">
                <h2 className="text-2xl font-bold text-gray-800">Board</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    + New Task
                </button>
            </div>

            <div className="flex h-full gap-4 overflow-x-auto px-4 items-start pb-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {columns.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            column={col}
                            tasks={filteredTasks.filter(t => t.column_id === col.id)}
                            profiles={profiles}
                            onTaskClick={handleTaskClick}
                            onDeleteTask={handleDeleteTask}
                        />
                    ))}

                    {createPortal(
                        <DragOverlay>
                            {activeTask && (
                                <TaskCard
                                    task={activeTask}
                                    profile={activeTask.assignee_id ? profiles[activeTask.assignee_id] : null}
                                />
                            )}
                        </DragOverlay>,
                        document.body
                    )}
                </DndContext>
            </div>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskCreated={handleTaskCreated}
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


import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskColumn, Task, Profile } from '@/types';
import { TaskCard } from './TaskCard';
import { clsx } from 'clsx';
import { useDroppable } from '@dnd-kit/core'; // Added import
import { useMemo } from 'react'; // Added import
import { MoreHorizontal } from 'lucide-react'; // Added import

interface Props {
    column: TaskColumn;
    tasks: Task[];
    profiles: Record<string, Profile>;
    onTaskClick: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
}

export function KanbanColumn({ column, tasks, profiles, onTaskClick, onDeleteTask }: Props) {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

    return (
        <div className="flex flex-col w-80 bg-gray-50 rounded-xl border border-gray-200 shadow-sm flex-shrink-0 max-h-full">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white rounded-t-xl">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-700">{column.title}</h3>
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                        {tasks.length}
                    </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded transition-colors">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            {/* Task List */}
            <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-[150px] flex flex-col gap-3">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            profile={task.assignee_id ? profiles[task.assignee_id] : null}
                            onClick={() => onTaskClick(task)}
                            onDelete={() => onDeleteTask(task.id)}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

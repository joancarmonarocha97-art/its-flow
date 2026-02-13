
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskColumn, Task, Profile } from '@/types';
import { TaskCard } from './TaskCard';
import { clsx } from 'clsx';

interface Props {
    column: TaskColumn;
    tasks: Task[];
    profiles: Record<string, Profile>;
    onTaskClick: (task: Task) => void;
}

export function KanbanColumn({ column, tasks, profiles, onTaskClick }: Props) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
        disabled: true, // Disable column drag for now if we want fixed columns
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const taskIds = tasks.map(t => t.id);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex flex-col w-80 h-full max-h-full rounded-xl bg-gray-50/50 border border-gray-200"
        >
            <div className="p-4 font-semibold text-gray-700 flex justify-between items-center bg-white rounded-t-xl border-b border-gray-100">
                <h3>{column.title}</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {tasks.length}
                </span>
            </div>

            <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto min-h-[100px]">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            profile={task.assignee_id ? profiles[task.assignee_id] : null}
                            onClick={() => onTaskClick(task)}
                        />
                    ))}
                </SortableContext>
                {/* Placeholder for dropping */}
            </div>
        </div>
    );
}

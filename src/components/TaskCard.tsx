
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Profile } from '@/types';
import { AlignLeft, Calendar, MoreHorizontal, Trash2, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Props {
    task: Task;
    profile?: Profile | null;
    onClick?: () => void;
    onDelete?: () => void;
}

export function TaskCard({ task, profile, onClick, onDelete }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const priorityColors = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={twMerge(
                "bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group relative",
                "flex flex-col gap-2"
            )}
        >
            {/* Delete Button (Visible on Hover) */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all z-10"
                    title="Delete task"
                >
                    <Trash2 size={16} />
                </button>
            )}

            <div className="flex justify-between items-start">
                <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", priorityColors[task.priority])}>
                    {task.priority}
                </span>
                {/* Actions could go here */}
            </div>
            <h3 className="font-medium text-gray-900">{task.title}</h3>
            {task.due_date && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                    <Clock size={12} />
                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
            )}
            {profile && (
                <div className="flex justify-end mt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs" title={profile.full_name || ''}>
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full" />
                        ) : (
                            (profile.full_name?.[0] || '?')
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Profile } from '@/types';
import { Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Props {
    task: Task;
    profile?: Profile | null;
    onClick?: () => void;
}

export function TaskCard({ task, profile, onClick }: Props) {
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
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className={twMerge(
                    "bg-white p-4 rounded-lg shadow-sm border-2 border-primary/50 opacity-50 h-[100px]",
                    "cursor-grab"
                )}
            />
        );
    }

    const priorityColor = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-orange-100 text-orange-800',
        critical: 'bg-red-100 text-red-800',
    }[task.priority];

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={twMerge(
                "bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group",
                "flex flex-col gap-2"
            )}
        >
            <div className="flex justify-between items-start">
                <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", priorityColor)}>
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

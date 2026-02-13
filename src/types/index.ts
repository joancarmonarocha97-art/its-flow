
export interface Profile {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: 'manager' | 'technician'
}

export interface TaskColumn {
    id: string
    title: string
    position: number
}

export interface Task {
    id: string
    title: string
    description: string | null
    column_id: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    assignee_id: string | null
    due_date: string | null
    created_at: string
}

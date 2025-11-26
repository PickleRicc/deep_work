import { createClient } from '@/lib/supabase/server'
import { Task, Project } from '@/lib/types/database'
import QueueManager from './queue-manager'

export default async function QueuePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Fetch active tasks (max 3)
    const { data: activeTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .returns<Task[]>()

    // Fetch queued tasks (backlog status with queue_position set)
    const { data: queuedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'backlog')
        .not('queue_position', 'is', null)
        .order('queue_position', { ascending: true })
        .returns<Task[]>()

    // Fetch recently completed tasks (limit 5)
    const { data: completedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5)
        .returns<Task[]>()

    // Fetch all projects
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<Project[]>()

    return (
        <div className="min-h-screen flex flex-col pb-24 md:pb-8">
            <div className="px-4 md:px-8 lg:px-12 pt-6 md:pt-8 pb-4">
                <h1 className="text-2xl sm:text-4xl font-bold text-white">Work Queue</h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">Pull-based task management</p>
            </div>

            <div className="flex-1 overflow-visible md:overflow-hidden">
                <QueueManager
                    activeTasks={activeTasks || []}
                    queuedTasks={queuedTasks || []}
                    completedTasks={completedTasks || []}
                    projects={projects || []}
                />
            </div>
        </div>
    )
}

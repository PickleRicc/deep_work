import { createClient } from '@/lib/supabase/server'
import { Task, Project, TaskReview, ProjectReview } from '@/lib/types/database'
import ReviewsClient from './reviews-client'

export default async function ReviewsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Fetch completed tasks without reviews
    const { data: completedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .returns<Task[]>()

    // Fetch existing task reviews
    const { data: taskReviews } = await supabase
        .from('task_reviews')
        .select('task_id')
        .eq('user_id', user.id)
        .returns<{ task_id: string }[]>()

    const reviewedTaskIds = new Set(taskReviews?.map(r => r.task_id) || [])
    const unreviewedTasks = completedTasks?.filter(t => !reviewedTaskIds.has(t.id)) || []

    // Fetch completed projects without reviews
    const { data: completedProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .returns<Project[]>()

    // Fetch existing project reviews
    const { data: projectReviews } = await supabase
        .from('project_reviews')
        .select('project_id')
        .eq('user_id', user.id)
        .returns<{ project_id: string }[]>()

    const reviewedProjectIds = new Set(projectReviews?.map(r => r.project_id) || [])
    const unreviewedProjects = completedProjects?.filter(p => !reviewedProjectIds.has(p.id)) || []

    return (
        <div className="space-y-6 px-4 md:px-8 lg:px-12 py-6 md:py-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Pending Reviews</h1>
                <p className="text-gray-400 mt-2">
                    Help improve your AI by reviewing completed tasks and projects
                </p>
            </div>

            <ReviewsClient 
                unreviewedTasks={unreviewedTasks}
                unreviewedProjects={unreviewedProjects}
            />
        </div>
    )
}


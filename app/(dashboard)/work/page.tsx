import { createClient } from '@/lib/supabase/server'
import { TimeBlock, Task, UserWorkHours, QuarterlyPlan, WeeklyPlan, Project } from '@/lib/types/database'
import WorkTabs from './work-tabs'
import { getLocalDateString } from '@/lib/utils/date'

export default async function WorkPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string; tab?: string }>
}) {
    const supabase = await createClient()
    const params = await searchParams

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Use provided date or default to today (in user's local timezone)
    const selectedDate = params.date || getLocalDateString()

    // Fetch time blocks for selected date (Block tab)
    const { data: timeBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .order('start_time', { ascending: true })
        .returns<TimeBlock[]>()

    // Fetch active tasks (max 3) for Block tab
    const { data: activeTasksForBlock } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(3)
        .returns<Task[]>()

    // Fetch user work hours
    const { data: workHours } = await supabase
        .from('user_work_hours')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week')
        .returns<UserWorkHours[]>()

    // Fetch active tasks for Queue tab
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

    // Calculate current quarter and week for Plan tab
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const quarter = Math.floor(month / 3) + 1
    const currentQuarter = `${year}-Q${quarter}`

    // Calculate week start (Sunday of current week) in local timezone
    const today = new Date()
    const dayOfWeek = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    const weekStartString = getLocalDateString(weekStart)

    // Fetch quarterly plan
    const { data: quarterlyPlans } = await supabase
        .from('quarterly_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .returns<QuarterlyPlan[]>()

    const quarterlyPlan = quarterlyPlans?.[0] || null

    // Fetch weekly plan
    const { data: weeklyPlans } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStartString)
        .returns<WeeklyPlan[]>()

    const weeklyPlan = weeklyPlans?.[0] || null

    // Fetch all projects
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<Project[]>()

    // Fetch all quarterly plans for project linking
    const { data: allQuarterlyPlans } = await supabase
        .from('quarterly_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<QuarterlyPlan[]>()

    // Fetch all weekly plans for project linking
    const { data: allWeeklyPlans } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(10)
        .returns<WeeklyPlan[]>()

    return (
        <WorkTabs
            // Block data
            timeBlocks={timeBlocks || []}
            activeTasksForBlock={activeTasksForBlock || []}
            workHours={workHours || []}
            selectedDate={selectedDate}
            userId={user.id}
            // Queue data
            activeTasks={activeTasks || []}
            queuedTasks={queuedTasks || []}
            completedTasks={completedTasks || []}
            // Plan data
            quarterlyPlan={quarterlyPlan}
            weeklyPlan={weeklyPlan}
            currentQuarter={currentQuarter}
            weekStart={weekStartString}
            // Project data
            projects={projects || []}
            allQuarterlyPlans={allQuarterlyPlans || []}
            allWeeklyPlans={allWeeklyPlans || []}
            // Initial tab
            initialTab={params.tab || 'block'}
        />
    )
}


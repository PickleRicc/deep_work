import { createClient } from '@/lib/supabase/server'
import { TimeBlock, Task, UserWorkHours, QuarterlyPlan, WeeklyPlan, Project } from '@/lib/types/database'
import WorkTabs from './work-tabs'
import { getDateInTimezone } from '@/lib/utils/date'
import { workQuotes } from '@/components/page-quotes'

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

    // Get user's timezone from profile
    const { data: profileData } = await supabase
        .from('user_profiles')
        .select('timezone')
        .eq('user_id', user.id)
        .single()

    const timezone = profileData?.timezone || 'America/New_York'

    // Use provided date or default to today (in user's timezone)
    const selectedDate = params.date || getDateInTimezone(timezone)

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

    // Calculate current quarter and week for Plan tab using user's timezone
    const userDateStr = getDateInTimezone(timezone)
    const userDate = new Date(userDateStr + 'T12:00:00')
    const month = userDate.getMonth()
    const year = userDate.getFullYear()
    const quarter = Math.floor(month / 3) + 1
    const currentQuarter = `${year}-Q${quarter}`

    // Calculate week start (Sunday of current week) in user's timezone
    const dayOfWeek = userDate.getDay()
    const weekStart = new Date(userDate)
    weekStart.setDate(userDate.getDate() - dayOfWeek)
    const weekStartString = getDateInTimezone(timezone, weekStart)

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
            // Quotes
            quotes={workQuotes}
        />
    )
}


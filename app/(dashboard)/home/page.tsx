import { createClient } from '@/lib/supabase/server'
import { TimeBlock, Task } from '@/lib/types/database'
import { calculateAnalytics, getDailyFocusData } from '@/lib/analytics'
import CurrentBlockCard from './current-block-card'
import TaskQueueCard from './task-queue-card'
import FocusStatsCard from './focus-stats-card'
import WeeklyPlanCard from './weekly-plan-card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getLocalDateString } from '@/lib/utils/date'

export default async function HomePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const now = new Date()
    const today = getLocalDateString()
    const currentTime = now.toTimeString().slice(0, 5)

    // Fetch today's time blocks
    const { data: todayBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('start_time', { ascending: true })
        .returns<TimeBlock[]>()

    // Fetch active tasks
    const { data: activeTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(3)
        .returns<Task[]>()

    // Fetch queued tasks
    const { data: queuedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'backlog')
        .not('queue_position', 'is', null)
        .order('queue_position', { ascending: true })
        .limit(5)
        .returns<Task[]>()

    // Fetch this week's plan
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek)
    const weekStartString = getLocalDateString(weekStart)

    const { data: weeklyPlans } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStartString)
        .limit(1)

    const weeklyPlan = weeklyPlans?.[0] || null

    // Fetch last 30 days of blocks for analytics
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const thirtyDaysAgoStr = getLocalDateString(thirtyDaysAgo)

    const { data: allBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgoStr)
        .returns<TimeBlock[]>()

    // Fetch all tasks for analytics
    const { data: allTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .returns<Task[]>()

    // Calculate analytics
    const blocks = todayBlocks || []
    const tasks = allTasks || []
    const analytics = calculateAnalytics(allBlocks || [], tasks, allBlocks || [])

    // Find current or next block
    const currentBlock = blocks.find(b => 
        b.start_time <= currentTime && b.end_time > currentTime
    )

    const nextBlock = blocks.find(b => b.start_time > currentTime)

    // Get user profile for name
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single()

    const userName = profile?.display_name || null

    return (
        <div className="space-y-6 px-4 md:px-8 lg:px-12 py-6 md:py-8 max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-white">
                    {getGreeting()}{userName ? `, ${userName}` : ''}
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Top Row - Current Block */}
            <CurrentBlockCard
                currentBlock={currentBlock}
                nextBlock={nextBlock}
                currentTime={currentTime}
            />

            {/* Middle Row - Task Queue & Focus Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TaskQueueCard
                    activeTasks={activeTasks || []}
                    queuedTasks={queuedTasks || []}
                />
                <FocusStatsCard analytics={analytics} />
            </div>

            {/* Weekly Plan */}
            <WeeklyPlanCard weeklyPlan={weeklyPlan} />

            {/* View All Link */}
            <div className="flex justify-center pt-4">
                <Link
                    href="/analytics"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                >
                    View detailed analytics
                    <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    )
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
}


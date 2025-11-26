import { createClient } from '@/lib/supabase/server'
import { TimeBlock, Task, UserWorkHours } from '@/lib/types/database'
import ActiveProjects from './active-projects'
import BlockSchedule from './block-schedule'
import WorkHoursConfig from './work-hours-config'
import PomodoroTimer from '@/components/pomodoro-timer'
import { getLocalDateString } from '@/lib/utils/date'

export default async function BlockPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const supabase = await createClient()
    const params = await searchParams

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Use provided date or default to today (in user's local timezone)
    const selectedDate = params.date || getLocalDateString()

    // Format date for display
    const displayDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })

    // Fetch time blocks for selected date
    const { data: timeBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .order('start_time', { ascending: true })
        .returns<TimeBlock[]>()

    // Fetch active tasks (max 3)
    const { data: activeTasks } = await supabase
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

    return (
        <div className="space-y-6 md:space-y-8 px-4 md:px-8 lg:px-12 py-6 md:py-8 max-w-6xl mx-auto">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-white">Time Blocking</h1>
                        <p className="text-gray-400 mt-1 text-sm sm:text-base">{displayDate}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <PomodoroTimer variant="inline" />
                    <WorkHoursConfig userId={user.id} />
                </div>
            </div>

            <ActiveProjects tasks={activeTasks || []} />

            <BlockSchedule 
                blocks={timeBlocks || []} 
                selectedDate={selectedDate}
                activeTasks={activeTasks || []}
                workHours={workHours || []}
            />
        </div>
    )
}


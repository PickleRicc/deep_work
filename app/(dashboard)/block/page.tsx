import { createClient } from '@/lib/supabase/server'
import { TimeBlock, Task } from '@/lib/types/database'
import ActiveProjects from './active-projects'
import BlockSchedule from './block-schedule'

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

    // Use provided date or default to today
    const selectedDate = params.date || new Date().toISOString().split('T')[0]

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

    return (
        <div className="space-y-8 px-4 md:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-4xl font-bold text-white">Time Blocking</h1>
                <p className="text-gray-400 mt-1">{displayDate}</p>
            </div>

            <ActiveProjects tasks={activeTasks || []} />

            <BlockSchedule 
                blocks={timeBlocks || []} 
                selectedDate={selectedDate}
            />
        </div>
    )
}


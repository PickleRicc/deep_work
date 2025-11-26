import { createClient } from '@/lib/supabase/server'
import { TimeBlock, Task } from '@/lib/types/database'
import {
    calculateAnalytics,
    getDailyFocusData,
    getBlockDistribution,
    getHourlyProductivity,
    getPeakHoursData
} from '@/lib/analytics'
import StatsCards from './stats-cards'
import FocusTimeChart from './focus-time-chart'
import BlockDistributionChart from './block-distribution-chart'
import FocusHeatmap from './focus-heatmap'
import PeakHoursChart from './peak-hours-chart'
import ProductivityScore from './productivity-score'
import { BarChart3 } from 'lucide-react'
import { getLocalDateString } from '@/lib/utils/date'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Calculate date ranges in local timezone
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const thirtyDaysAgoStr = getLocalDateString(thirtyDaysAgo)

    // Fetch all time blocks for last 30 days
    const { data: allBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgoStr)
        .order('date', { ascending: true })
        .returns<TimeBlock[]>()

    // Fetch recent tasks
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'completed'])
        .returns<Task[]>()

    // Use the blocks data
    const blocks = allBlocks || []
    const taskList = tasks || []

    // Calculate analytics data
    const analyticsData = calculateAnalytics(blocks, taskList, blocks)
    const dailyFocusData = getDailyFocusData(blocks)
    const blockDistribution = getBlockDistribution(blocks)
    const hourlyProductivity = getHourlyProductivity(blocks)
    const peakHoursData = getPeakHoursData(blocks)

    return (
        <div className="space-y-6 md:space-y-8 px-4 md:px-8 lg:px-12 py-6 md:py-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <BarChart3 size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-white">Analytics</h1>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">
                        Insights into your productivity patterns
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <StatsCards data={analyticsData} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Productivity Score - Takes 1 column */}
                <div className="lg:col-span-1">
                    <ProductivityScore score={analyticsData.productivityScore} />
                </div>

                {/* Block Distribution - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <BlockDistributionChart data={blockDistribution} />
                </div>
            </div>

            {/* Focus Time Chart - Full width */}
            <FocusTimeChart data={dailyFocusData} />

            {/* Peak Hours Chart - Full width */}
            <PeakHoursChart data={peakHoursData} />

            {/* Focus Heatmap - Full width */}
            <FocusHeatmap data={hourlyProductivity} />

            {/* Empty state */}
            {blocks.length === 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center backdrop-blur-sm">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
                        <BarChart3 size={40} className="text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        No analytics data yet
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Start tracking your time with blocks to see insights about your productivity patterns.
                    </p>
                </div>
            )}
        </div>
    )
}


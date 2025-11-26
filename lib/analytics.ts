import { TimeBlock, Task } from './types/database'

export interface AnalyticsData {
    focusHours: {
        thisWeek: number
        lastWeek: number
        percentChange: number
    }
    streaks: {
        current: number
        longest: number
    }
    tasksCompleted: number
    averageSessionDuration: number
    productivityScore: number
}

export interface DailyFocusData {
    date: string
    hours: number
    deepWork: number
    shallowWork: number
    [key: string]: string | number // Index signature for Recharts compatibility
}

export interface BlockDistribution {
    name: string
    value: number
    percentage: number
    color: string
    [key: string]: string | number // Index signature for Recharts compatibility
}

export interface HourlyProductivity {
    hour: number
    intensity: number
    [key: string]: number // Index signature for Recharts compatibility
}

export interface PeakHourData {
    hour: string
    minutes: number
    [key: string]: string | number // Index signature for Recharts compatibility
}

/**
 * Calculate total minutes from time blocks
 */
export function calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    return (endHour * 60 + endMin) - (startHour * 60 + startMin)
}

/**
 * Calculate analytics data from time blocks and tasks
 */
export function calculateAnalytics(
    blocks: TimeBlock[],
    tasks: Task[],
    allBlocks: TimeBlock[]
): AnalyticsData {
    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay()) // Start of this week (Sunday)
    thisWeekStart.setHours(0, 0, 0, 0)
    
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)
    
    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setMilliseconds(-1)

    // Calculate this week's focus hours
    const thisWeekBlocks = blocks.filter(b => {
        const blockDate = new Date(b.date + 'T00:00:00')
        return blockDate >= thisWeekStart && ['deep_work', 'shallow_work'].includes(b.block_type)
    })
    
    const thisWeekMinutes = thisWeekBlocks.reduce((sum, block) => {
        return sum + calculateDuration(block.start_time, block.end_time)
    }, 0)
    const thisWeekHours = thisWeekMinutes / 60

    // Calculate last week's focus hours
    const lastWeekBlocks = allBlocks.filter(b => {
        const blockDate = new Date(b.date + 'T00:00:00')
        return blockDate >= lastWeekStart && blockDate <= lastWeekEnd && ['deep_work', 'shallow_work'].includes(b.block_type)
    })
    
    const lastWeekMinutes = lastWeekBlocks.reduce((sum, block) => {
        return sum + calculateDuration(block.start_time, block.end_time)
    }, 0)
    const lastWeekHours = lastWeekMinutes / 60

    // Calculate percent change
    const percentChange = lastWeekHours > 0
        ? ((thisWeekHours - lastWeekHours) / lastWeekHours) * 100
        : thisWeekHours > 0 ? 100 : 0

    // Calculate streaks
    const streaks = calculateStreaks(allBlocks)

    // Count completed tasks
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length

    // Calculate average session duration
    const focusBlocks = blocks.filter(b => ['deep_work', 'shallow_work'].includes(b.block_type))
    const averageSessionDuration = focusBlocks.length > 0
        ? focusBlocks.reduce((sum, block) => sum + calculateDuration(block.start_time, block.end_time), 0) / focusBlocks.length
        : 0

    // Calculate productivity score
    const deepWorkHours = blocks
        .filter(b => b.block_type === 'deep_work')
        .reduce((sum, block) => sum + calculateDuration(block.start_time, block.end_time), 0) / 60
    
    const productivityScore = Math.min(
        100,
        Math.round((deepWorkHours * 15) + (tasksCompleted * 10) + (streaks.current * 5))
    )

    return {
        focusHours: {
            thisWeek: Math.round(thisWeekHours * 10) / 10,
            lastWeek: Math.round(lastWeekHours * 10) / 10,
            percentChange: Math.round(percentChange * 10) / 10
        },
        streaks,
        tasksCompleted,
        averageSessionDuration: Math.round(averageSessionDuration),
        productivityScore
    }
}

/**
 * Calculate current and longest streaks
 */
function calculateStreaks(blocks: TimeBlock[]): { current: number; longest: number } {
    // Get unique dates with deep work
    const datesWithDeepWork = new Set(
        blocks
            .filter(b => b.block_type === 'deep_work')
            .map(b => b.date)
    )

    if (datesWithDeepWork.size === 0) {
        return { current: 0, longest: 0 }
    }

    const sortedDates = Array.from(datesWithDeepWork).sort()
    
    let currentStreak = 0
    let longestStreak = 0
    let streakCount = 1

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Check if there's activity today or yesterday
    const hasToday = datesWithDeepWork.has(todayStr)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const hasYesterday = datesWithDeepWork.has(yesterdayStr)

    if (!hasToday && !hasYesterday) {
        currentStreak = 0
    } else {
        // Calculate current streak from most recent date
        let checkDate = new Date(hasToday ? todayStr : yesterdayStr)
        currentStreak = 1

        while (true) {
            checkDate.setDate(checkDate.getDate() - 1)
            const checkStr = checkDate.toISOString().split('T')[0]
            if (datesWithDeepWork.has(checkStr)) {
                currentStreak++
            } else {
                break
            }
        }
    }

    // Calculate longest streak
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1] + 'T00:00:00')
        const currDate = new Date(sortedDates[i] + 'T00:00:00')
        const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

        if (dayDiff === 1) {
            streakCount++
            longestStreak = Math.max(longestStreak, streakCount)
        } else {
            streakCount = 1
        }
    }

    longestStreak = Math.max(longestStreak, currentStreak, streakCount)

    return { current: currentStreak, longest: longestStreak }
}

/**
 * Get daily focus data for the last 30 days
 */
export function getDailyFocusData(blocks: TimeBlock[]): DailyFocusData[] {
    const data: { [date: string]: DailyFocusData } = {}
    const today = new Date()
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        data[dateStr] = {
            date: dateStr,
            hours: 0,
            deepWork: 0,
            shallowWork: 0
        }
    }

    // Aggregate block data
    blocks.forEach(block => {
        if (data[block.date] && ['deep_work', 'shallow_work'].includes(block.block_type)) {
            const duration = calculateDuration(block.start_time, block.end_time) / 60
            data[block.date].hours += duration
            
            if (block.block_type === 'deep_work') {
                data[block.date].deepWork += duration
            } else {
                data[block.date].shallowWork += duration
            }
        }
    })

    return Object.values(data).map(d => ({
        ...d,
        hours: Math.round(d.hours * 10) / 10,
        deepWork: Math.round(d.deepWork * 10) / 10,
        shallowWork: Math.round(d.shallowWork * 10) / 10
    }))
}

/**
 * Get block type distribution
 */
export function getBlockDistribution(blocks: TimeBlock[]): BlockDistribution[] {
    const distribution: { [key: string]: number } = {
        deep_work: 0,
        shallow_work: 0,
        break: 0,
        personal: 0,
        meeting: 0
    }

    let totalMinutes = 0

    blocks.forEach(block => {
        const duration = calculateDuration(block.start_time, block.end_time)
        distribution[block.block_type] = (distribution[block.block_type] || 0) + duration
        totalMinutes += duration
    })

    const colors: { [key: string]: string } = {
        deep_work: '#3b82f6',
        shallow_work: '#6b7280',
        break: '#10b981',
        personal: '#8b5cf6',
        meeting: '#f59e0b'
    }

    const labels: { [key: string]: string } = {
        deep_work: 'Deep Work',
        shallow_work: 'Shallow Work',
        break: 'Breaks',
        personal: 'Personal',
        meeting: 'Meetings'
    }

    return Object.entries(distribution)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
            name: labels[key] || key,
            value: Math.round(value / 60 * 10) / 10,
            percentage: totalMinutes > 0 ? Math.round((value / totalMinutes) * 100) : 0,
            color: colors[key] || '#6b7280'
        }))
        .sort((a, b) => b.value - a.value)
}

/**
 * Get hourly productivity heatmap data
 */
export function getHourlyProductivity(blocks: TimeBlock[]): HourlyProductivity[][] {
    // Create 7 days x 24 hours grid
    const heatmap: HourlyProductivity[][] = []
    
    for (let day = 0; day < 7; day++) {
        const dayData: HourlyProductivity[] = []
        for (let hour = 0; hour < 24; hour++) {
            dayData.push({ hour, intensity: 0 })
        }
        heatmap.push(dayData)
    }

    // Aggregate data
    blocks.forEach(block => {
        if (!['deep_work', 'shallow_work'].includes(block.block_type)) return

        const date = new Date(block.date + 'T00:00:00')
        const dayOfWeek = date.getDay()
        const startHour = parseInt(block.start_time.split(':')[0])
        const endHour = parseInt(block.end_time.split(':')[0])

        for (let hour = startHour; hour <= endHour && hour < 24; hour++) {
            heatmap[dayOfWeek][hour].intensity += 1
        }
    })

    return heatmap
}

/**
 * Get peak hours data
 */
export function getPeakHoursData(blocks: TimeBlock[]): PeakHourData[] {
    const hourlyMinutes: { [hour: number]: number } = {}

    // Initialize hours
    for (let i = 0; i < 24; i++) {
        hourlyMinutes[i] = 0
    }

    // Aggregate by hour
    blocks.forEach(block => {
        if (!['deep_work', 'shallow_work'].includes(block.block_type)) return

        const startHour = parseInt(block.start_time.split(':')[0])
        const endHour = parseInt(block.end_time.split(':')[0])
        const duration = calculateDuration(block.start_time, block.end_time)

        // Distribute duration across hours
        const hourSpan = endHour - startHour + 1
        const avgPerHour = duration / hourSpan

        for (let hour = startHour; hour <= endHour && hour < 24; hour++) {
            hourlyMinutes[hour] += avgPerHour
        }
    })

    // Format hours and convert to data
    return Object.entries(hourlyMinutes)
        .map(([hour, minutes]) => {
            const h = parseInt(hour)
            const period = h >= 12 ? 'PM' : 'AM'
            const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
            return {
                hour: `${displayHour}${period}`,
                minutes: Math.round(minutes)
            }
        })
        .filter(d => d.minutes > 0)
}


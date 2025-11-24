import { createClient } from '@/lib/supabase/server'
import { QuarterlyPlan, WeeklyPlan } from '@/lib/types/database'
import { PlanTabs } from './plan-tabs'

export default async function PlanPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Calculate current quarter (Q1-Q4 based on month)
    const now = new Date()
    const month = now.getMonth() // 0-11
    const year = now.getFullYear()
    const quarter = Math.floor(month / 3) + 1
    const currentQuarter = `${year}-Q${quarter}`

    // Fetch most recent quarterly plan for user
    const { data: quarterlyPlans } = await supabase
        .from('quarterly_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .returns<QuarterlyPlan[]>()

    const quarterlyPlan = quarterlyPlans?.[0] || null

    // Calculate week start (Sunday of current week)
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    const weekStartString = weekStart.toISOString().split('T')[0]

    // Fetch weekly plan where week_start matches
    const { data: weeklyPlans } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStartString)
        .returns<WeeklyPlan[]>()

    const weeklyPlan = weeklyPlans?.[0] || null

    return (
        <div className="space-y-8 px-4 md:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-4xl font-bold text-white">Planning</h1>
                <p className="text-gray-400 mt-1">Multi-scale planning system</p>
            </div>

            <PlanTabs
                quarterlyPlan={quarterlyPlan}
                weeklyPlan={weeklyPlan}
                currentQuarter={currentQuarter}
                weekStart={weekStartString}
            />
        </div>
    )
}

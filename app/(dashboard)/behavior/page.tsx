import { createClient } from '@/lib/supabase/server'
import { Behavior, BehaviorCheckin } from '@/lib/types/database'
import BehaviorManager from './behavior-manager'

export default async function BehaviorPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Fetch all behaviors
    const { data: behaviors } = await supabase
        .from('behaviors')
        .select('*')
        .eq('user_id', user.id)
        .order('behavior_name', { ascending: true })
        .returns<Behavior[]>()

    // Fetch recent check-ins (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: checkins } = await supabase
        .from('behavior_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgoStr)
        .order('date', { ascending: false })
        .returns<BehaviorCheckin[]>()

    return (
        <div className="space-y-6 md:space-y-8 px-4 md:px-8 lg:px-12 py-6 md:py-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-white">Behavior Tracking</h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">Understand what rewards you</p>
            </div>

            <BehaviorManager 
                initialBehaviors={behaviors || []}
                initialCheckins={checkins || []}
            />
        </div>
    )
}


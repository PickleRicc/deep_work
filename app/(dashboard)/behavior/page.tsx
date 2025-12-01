import { createClient } from '@/lib/supabase/server'
import { Behavior, BehaviorCheckin } from '@/lib/types/database'
import BehaviorManager from './behavior-manager'
import PageQuotes, { behaviorQuotes } from '@/components/page-quotes'
import { getDateInTimezone } from '@/lib/utils/date'

export default async function BehaviorPage() {
    const supabase = await createClient()

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

    // Fetch all behaviors
    const { data: behaviors } = await supabase
        .from('behaviors')
        .select('*')
        .eq('user_id', user.id)
        .order('behavior_name', { ascending: true })
        .returns<Behavior[]>()

    // Fetch recent check-ins (last 30 days) in user's timezone
    const userDateStr = getDateInTimezone(timezone)
    const userDate = new Date(userDateStr + 'T12:00:00')
    const thirtyDaysAgo = new Date(userDate)
    thirtyDaysAgo.setDate(userDate.getDate() - 30)
    const thirtyDaysAgoStr = getDateInTimezone(timezone, thirtyDaysAgo)

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

            {/* Motivational Quotes */}
            <PageQuotes quotes={behaviorQuotes} />

            <BehaviorManager 
                initialBehaviors={behaviors || []}
                initialCheckins={checkins || []}
            />
        </div>
    )
}


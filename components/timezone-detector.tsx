'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Component that detects and saves the user's timezone to their profile.
 * Runs once on mount and updates if timezone differs from stored value.
 */
export default function TimezoneDetector() {
    useEffect(() => {
        const detectAndSaveTimezone = async () => {
            const supabase = createClient()
            
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get the browser's timezone
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
            
            // Get the user's stored timezone
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('timezone')
                .eq('user_id', user.id)
                .single()

            // If no profile or timezone differs, update it
            if (!profile) {
                // Create profile with timezone
                await supabase
                    .from('user_profiles')
                    .upsert({
                        user_id: user.id,
                        timezone: browserTimezone,
                    })
            } else if (profile.timezone !== browserTimezone) {
                // Update timezone if different (user may have traveled)
                await supabase
                    .from('user_profiles')
                    .update({ timezone: browserTimezone })
                    .eq('user_id', user.id)
            }
        }

        detectAndSaveTimezone()
    }, [])

    // This component doesn't render anything
    return null
}


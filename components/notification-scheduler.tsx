'use client'

import { useBlockNotifications } from '@/hooks/use-block-notifications'

// This component runs in the background and handles notifications
export default function NotificationScheduler() {
    // This hook sets up the notification checking interval
    useBlockNotifications()
    
    // This component doesn't render anything visible
    return null
}



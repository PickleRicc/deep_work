'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TimeBlock {
    id: string
    title: string
    start_time: string
    end_time: string
    date: string
    category: string
}

export function useBlockNotifications() {
    const supabase = createClient()
    const notifiedBlocks = useRef<Set<string>>(new Set())
    const checkInterval = useRef<NodeJS.Timeout | null>(null)

    const showNotification = useCallback((block: TimeBlock, minutesUntil: number) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return
        }

        // Don't notify the same block twice
        const notificationKey = `${block.id}-${block.date}`
        if (notifiedBlocks.current.has(notificationKey)) {
            return
        }
        notifiedBlocks.current.add(notificationKey)

        const categoryEmoji: Record<string, string> = {
            deep_work: '🎯',
            shallow_work: '📋',
            break: '☕',
            meeting: '👥',
            personal: '🏠',
        }

        const emoji = categoryEmoji[block.category] || '📅'
        const timeStr = new Date(`${block.date}T${block.start_time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        })

        new Notification(`${emoji} ${block.title}`, {
            body: minutesUntil <= 1 
                ? `Starting now at ${timeStr}` 
                : `Starting in ${minutesUntil} minutes at ${timeStr}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: notificationKey,
            requireInteraction: false,
            silent: false,
        })
    }, [])

    const checkUpcomingBlocks = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get user's notification preferences
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('notifications_enabled, notify_before_block')
                .eq('user_id', user.id)
                .single()

            if (!profile?.notifications_enabled) return

            const notifyMinutes = profile.notify_before_block || 5

            // Get today's date in local timezone
            const now = new Date()
            const today = now.toISOString().split('T')[0]
            const currentTimeMs = now.getTime()

            // Fetch today's blocks
            const { data: blocks } = await supabase
                .from('time_blocks')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .order('start_time', { ascending: true })

            if (!blocks?.length) return

            // Check each block
            for (const block of blocks) {
                const blockStartTime = new Date(`${block.date}T${block.start_time}`)
                const msUntilStart = blockStartTime.getTime() - currentTimeMs
                const minutesUntilStart = msUntilStart / 1000 / 60

                // Notify if within the notification window (but not past)
                if (minutesUntilStart > 0 && minutesUntilStart <= notifyMinutes) {
                    showNotification(block, Math.round(minutesUntilStart))
                }
            }
        } catch (error) {
            console.error('Error checking blocks for notifications:', error)
        }
    }, [supabase, showNotification])

    useEffect(() => {
        // Initial check
        checkUpcomingBlocks()

        // Check every minute
        checkInterval.current = setInterval(checkUpcomingBlocks, 60000)

        return () => {
            if (checkInterval.current) {
                clearInterval(checkInterval.current)
            }
        }
    }, [checkUpcomingBlocks])

    return {
        requestPermission: async () => {
            if ('Notification' in window) {
                return await Notification.requestPermission()
            }
            return 'denied'
        },
        isSupported: typeof window !== 'undefined' && 'Notification' in window,
        permission: typeof window !== 'undefined' && 'Notification' in window 
            ? Notification.permission 
            : 'denied',
    }
}




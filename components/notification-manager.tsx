'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellOff, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface NotificationManagerProps {
    variant?: 'inline' | 'settings'
}

export default function NotificationManager({ variant = 'inline' }: NotificationManagerProps) {
    const supabase = createClient()
    const [isSupported, setIsSupported] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [notifyMinutes, setNotifyMinutes] = useState(5)
    const [isLoading, setIsLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        // Check if push notifications are supported
        const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
        setIsSupported(supported)

        if (supported) {
            setPermission(Notification.permission)
            checkSubscription()
            loadPreferences()
        }
    }, [])

    const loadPreferences = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('notifications_enabled, notify_before_block, push_subscription')
            .eq('user_id', user.id)
            .single()

        if (profile) {
            setIsSubscribed(!!profile.push_subscription && profile.notifications_enabled)
            setNotifyMinutes(profile.notify_before_block || 5)
        }
    }

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
        } catch (error) {
            console.error('Error checking subscription:', error)
        }
    }

    const subscribe = async () => {
        setIsLoading(true)
        try {
            // Request permission
            const permission = await Notification.requestPermission()
            setPermission(permission)

            if (permission !== 'granted') {
                setIsLoading(false)
                return
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready

            // Subscribe to push notifications
            // Note: In production, you'd use a VAPID public key from your server
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
                )
            })

            // Save to server
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: subscription.toJSON() })
            })

            if (response.ok) {
                setIsSubscribed(true)
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 2000)
            }
        } catch (error) {
            console.error('Error subscribing:', error)
        }
        setIsLoading(false)
    }

    const unsubscribe = async () => {
        setIsLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            
            if (subscription) {
                await subscription.unsubscribe()
            }

            await fetch('/api/notifications/subscribe', { method: 'DELETE' })
            setIsSubscribed(false)
        } catch (error) {
            console.error('Error unsubscribing:', error)
        }
        setIsLoading(false)
    }

    const updateNotifyMinutes = async (minutes: number) => {
        setNotifyMinutes(minutes)
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
            .from('user_profiles')
            .update({ notify_before_block: minutes })
            .eq('user_id', user.id)
    }

    if (!isSupported) {
        return variant === 'settings' ? (
            <div className="text-gray-500 text-sm">
                Push notifications are not supported on this device/browser.
            </div>
        ) : null
    }

    if (variant === 'inline') {
        return (
            <button
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={isLoading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                    isSubscribed 
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                }`}
            >
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : showSuccess ? (
                    <Check className="w-4 h-4" />
                ) : isSubscribed ? (
                    <Bell className="w-4 h-4" />
                ) : (
                    <BellOff className="w-4 h-4" />
                )}
                <span className="text-sm hidden sm:inline">
                    {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
                </span>
            </button>
        )
    }

    // Settings variant - full panel
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-white">Push Notifications</h3>
                    <p className="text-sm text-gray-400">Get reminded before your time blocks start</p>
                </div>
                <button
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={isLoading || permission === 'denied'}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        permission === 'denied'
                            ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                            : isSubscribed 
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : permission === 'denied' ? (
                        'Blocked'
                    ) : isSubscribed ? (
                        'Enabled'
                    ) : (
                        'Enable'
                    )}
                </button>
            </div>

            {permission === 'denied' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                    Notifications are blocked. Please enable them in your browser settings.
                </div>
            )}

            <AnimatePresence>
                {isSubscribed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                    >
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Notify me before blocks start
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {[5, 10, 15, 30].map((mins) => (
                                    <button
                                        key={mins}
                                        onClick={() => updateNotifyMinutes(mins)}
                                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                                            notifyMinutes === mins
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                        }`}
                                    >
                                        {mins} min
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-800/50 rounded-xl p-3">
                            <p className="text-sm text-gray-400">
                                You'll receive a notification <span className="text-white">{notifyMinutes} minutes</span> before each scheduled block.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}


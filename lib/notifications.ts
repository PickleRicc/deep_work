// Push notification utilities

export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

export function sendNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            ...options,
        })

        notification.onclick = () => {
            window.focus()
            notification.close()
        }

        return notification
    }
    return null
}

export interface UpcomingBlock {
    id: string
    task_title: string | null
    start_time: string
    end_time: string
    block_type: string
}

export function scheduleBlockNotification(
    block: UpcomingBlock,
    minutesBefore: number = 5
) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const blockStart = new Date(`${today}T${block.start_time}`)
    
    // Calculate when to send notification
    const notifyTime = new Date(blockStart.getTime() - minutesBefore * 60 * 1000)
    const msUntilNotify = notifyTime.getTime() - now.getTime()

    // If notification time has passed, don't schedule
    if (msUntilNotify <= 0) {
        return null
    }

    // Schedule the notification
    const timeoutId = setTimeout(() => {
        const blockName = block.task_title || formatBlockType(block.block_type)
        const startTimeFormatted = formatTime(block.start_time)
        
        sendNotification(`${blockName} starts in ${minutesBefore} minutes`, {
            body: `Scheduled for ${startTimeFormatted}`,
            tag: `block-${block.id}`,
            requireInteraction: false,
        })
    }, msUntilNotify)

    return timeoutId
}

function formatBlockType(type: string): string {
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Store scheduled notification timeouts
const scheduledNotifications = new Map<string, NodeJS.Timeout>()

export function scheduleAllBlockNotifications(
    blocks: UpcomingBlock[],
    minutesBefore: number = 5
) {
    // Clear any existing scheduled notifications
    scheduledNotifications.forEach((timeout) => clearTimeout(timeout))
    scheduledNotifications.clear()

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)

    // Filter to future blocks only
    const futureBlocks = blocks.filter(block => block.start_time > currentTime)

    // Schedule notifications for each block
    futureBlocks.forEach(block => {
        const timeoutId = scheduleBlockNotification(block, minutesBefore)
        if (timeoutId) {
            scheduledNotifications.set(block.id, timeoutId)
        }
    })

    console.log(`Scheduled ${scheduledNotifications.size} block notifications`)
}

export function cancelAllNotifications() {
    scheduledNotifications.forEach((timeout) => clearTimeout(timeout))
    scheduledNotifications.clear()
}


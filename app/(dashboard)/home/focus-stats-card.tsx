'use client'

import { motion } from 'motion/react'
import { Flame, Clock, TrendingUp, Target } from 'lucide-react'
import { AnalyticsData } from '@/lib/analytics'
import Link from 'next/link'

interface FocusStatsCardProps {
    analytics: AnalyticsData
}

export default function FocusStatsCard({ analytics }: FocusStatsCardProps) {
    const stats = [
        {
            icon: Flame,
            label: 'Current Streak',
            value: analytics.streaks.current,
            unit: analytics.streaks.current === 1 ? 'day' : 'days',
            color: 'text-orange-400',
        },
        {
            icon: Clock,
            label: 'This Week',
            value: analytics.focusHours.thisWeek.toFixed(1),
            unit: 'hours',
            color: 'text-blue-400',
        },
        {
            icon: TrendingUp,
            label: 'Avg Session',
            value: Math.floor(analytics.averageSessionDuration),
            unit: 'min',
            color: 'text-green-400',
        },
        {
            icon: Target,
            label: 'Score',
            value: analytics.productivityScore,
            unit: '/100',
            color: 'text-purple-400',
        },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">Focus Stats</h3>
                <Link href="/analytics" className="text-sm text-blue-400 hover:text-blue-300">
                    View analytics
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <div key={stat.label} className="text-center">
                            <Icon size={20} className={`${stat.color} mx-auto mb-2`} />
                            <div className="text-2xl font-bold text-white mb-1">
                                {stat.value}<span className="text-sm text-gray-500">{stat.unit}</span>
                            </div>
                            <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                    )
                })}
            </div>
        </motion.div>
    )
}




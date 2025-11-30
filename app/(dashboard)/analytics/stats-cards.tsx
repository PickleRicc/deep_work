'use client'

import { motion } from 'motion/react'
import { Clock, Flame, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import { AnalyticsData } from '@/lib/analytics'

interface StatsCardsProps {
    data: AnalyticsData
}

export default function StatsCards({ data }: StatsCardsProps) {
    const { focusHours, streaks, tasksCompleted, averageSessionDuration } = data

    const cards = [
        {
            title: 'Focus Hours',
            value: focusHours.thisWeek.toFixed(1),
            unit: 'hrs this week',
            change: focusHours.percentChange,
            icon: Clock,
            color: 'blue',
            comparison: `${focusHours.lastWeek.toFixed(1)}hrs last week`
        },
        {
            title: 'Current Streak',
            value: streaks.current.toString(),
            unit: streaks.current === 1 ? 'day' : 'days',
            icon: Flame,
            color: 'orange',
            comparison: `Longest: ${streaks.longest} ${streaks.longest === 1 ? 'day' : 'days'}`
        },
        {
            title: 'Tasks Done',
            value: tasksCompleted.toString(),
            unit: 'completed',
            icon: CheckCircle2,
            color: 'green'
        },
        {
            title: 'Avg Session',
            value: Math.floor(averageSessionDuration).toString(),
            unit: 'minutes',
            icon: TrendingUp,
            color: 'purple'
        }
    ]

    const getColorClasses = (color: string) => {
        const colors = {
            blue: {
                bg: 'from-blue-500/10 to-blue-600/5',
                border: 'border-blue-500/20',
                icon: 'text-blue-400',
                glow: 'shadow-blue-500/20'
            },
            orange: {
                bg: 'from-orange-500/10 to-orange-600/5',
                border: 'border-orange-500/20',
                icon: 'text-orange-400',
                glow: 'shadow-orange-500/20'
            },
            green: {
                bg: 'from-green-500/10 to-green-600/5',
                border: 'border-green-500/20',
                icon: 'text-green-400',
                glow: 'shadow-green-500/20'
            },
            purple: {
                bg: 'from-purple-500/10 to-purple-600/5',
                border: 'border-purple-500/20',
                icon: 'text-purple-400',
                glow: 'shadow-purple-500/20'
            }
        }
        return colors[color as keyof typeof colors] || colors.blue
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => {
                const colors = getColorClasses(card.color)
                const Icon = card.icon

                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-2xl p-6 backdrop-blur-sm hover:scale-105 transition-transform shadow-xl ${colors.glow}`}
                    >
                        {/* Icon */}
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colors.icon} bg-black/20 mb-4`}>
                            <Icon size={24} strokeWidth={2} />
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                            {card.title}
                        </h3>

                        {/* Value */}
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-white">
                                {card.value}
                            </span>
                            <span className="text-sm text-gray-500">
                                {card.unit}
                            </span>
                        </div>

                        {/* Comparison or Change */}
                        {card.change !== undefined ? (
                            <div className="flex items-center gap-1 text-sm">
                                {card.change > 0 ? (
                                    <>
                                        <TrendingUp size={14} className="text-green-400" />
                                        <span className="text-green-400 font-medium">
                                            +{card.change.toFixed(1)}%
                                        </span>
                                    </>
                                ) : card.change < 0 ? (
                                    <>
                                        <TrendingDown size={14} className="text-red-400" />
                                        <span className="text-red-400 font-medium">
                                            {card.change.toFixed(1)}%
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-gray-500">No change</span>
                                )}
                                <span className="text-gray-500 ml-1">vs last week</span>
                            </div>
                        ) : card.comparison ? (
                            <p className="text-sm text-gray-500">
                                {card.comparison}
                            </p>
                        ) : null}
                    </motion.div>
                )
            })}
        </div>
    )
}



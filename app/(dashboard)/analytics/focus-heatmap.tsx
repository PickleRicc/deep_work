'use client'

import { HourlyProductivity } from '@/lib/analytics'
import { motion } from 'motion/react'

interface FocusHeatmapProps {
    data: HourlyProductivity[][]
}

export default function FocusHeatmap({ data }: FocusHeatmapProps) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Find max intensity for scaling
    const maxIntensity = Math.max(
        ...data.flat().map(d => d.intensity),
        1
    )

    // Get color based on intensity
    const getColor = (intensity: number) => {
        if (intensity === 0) return 'bg-zinc-800/30'
        
        const normalized = intensity / maxIntensity
        if (normalized <= 0.25) return 'bg-blue-500/20'
        if (normalized <= 0.5) return 'bg-blue-500/40'
        if (normalized <= 0.75) return 'bg-blue-500/60'
        return 'bg-blue-500/80'
    }

    // Format hour for display
    const formatHour = (hour: number) => {
        if (hour === 0) return '12a'
        if (hour < 12) return `${hour}a`
        if (hour === 12) return '12p'
        return `${hour - 12}p`
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Focus Heatmap</h2>
                <p className="text-sm text-gray-400">Weekly focus intensity by hour</p>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Hour labels */}
                    <div className="flex mb-2">
                        <div className="w-12 flex-shrink-0"></div>
                        <div className="flex-1 grid grid-cols-24 gap-1">
                            {Array.from({ length: 24 }).map((_, hour) => (
                                <div
                                    key={hour}
                                    className="text-[10px] text-gray-500 text-center"
                                    style={{ minWidth: '20px' }}
                                >
                                    {hour % 4 === 0 ? formatHour(hour) : ''}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Heatmap grid */}
                    {data.map((dayData, dayIndex) => (
                        <div key={dayIndex} className="flex mb-1">
                            {/* Day label */}
                            <div className="w-12 flex-shrink-0 flex items-center">
                                <span className="text-xs text-gray-400 font-medium">
                                    {days[dayIndex]}
                                </span>
                            </div>
                            
                            {/* Hour cells */}
                            <div className="flex-1 grid grid-cols-24 gap-1">
                                {dayData.map((hourData, hourIndex) => (
                                    <motion.div
                                        key={hourIndex}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (dayIndex * 24 + hourIndex) * 0.001 }}
                                        className={`h-6 rounded ${getColor(hourData.intensity)} hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer group relative`}
                                        style={{ minWidth: '20px' }}
                                        title={`${days[dayIndex]} ${formatHour(hourData.hour)}: ${hourData.intensity} session${hourData.intensity !== 1 ? 's' : ''}`}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            <div className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap shadow-xl">
                                                {days[dayIndex]} {formatHour(hourData.hour)}
                                                <br />
                                                {hourData.intensity} block{hourData.intensity !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
                <span className="text-xs text-gray-500">Less</span>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-zinc-800/30"></div>
                    <div className="w-4 h-4 rounded bg-blue-500/20"></div>
                    <div className="w-4 h-4 rounded bg-blue-500/40"></div>
                    <div className="w-4 h-4 rounded bg-blue-500/60"></div>
                    <div className="w-4 h-4 rounded bg-blue-500/80"></div>
                </div>
                <span className="text-xs text-gray-500">More</span>
            </div>
        </motion.div>
    )
}



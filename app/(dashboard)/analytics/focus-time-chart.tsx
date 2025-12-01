'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DailyFocusData } from '@/lib/analytics'
import { motion } from 'motion/react'

interface FocusTimeChartProps {
    data: DailyFocusData[]
}

export default function FocusTimeChart({ data }: FocusTimeChartProps) {
    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-semibold mb-2">
                        {formatDate(data.date)}
                    </p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-blue-400 text-sm flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                Deep Work
                            </span>
                            <span className="text-white font-mono text-sm">
                                {data.deepWork.toFixed(1)}h
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                                Shallow Work
                            </span>
                            <span className="text-white font-mono text-sm">
                                {data.shallowWork.toFixed(1)}h
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-700">
                            <span className="text-gray-300 text-sm font-semibold">Total</span>
                            <span className="text-white font-mono text-sm font-bold">
                                {data.hours.toFixed(1)}h
                            </span>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Focus Trend</h2>
                <p className="text-sm text-gray-400">Daily focus hours over the last 30 days</p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="deepWorkGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="shallowWorkGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="#52525b"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="#52525b"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="deepWork"
                        stackId="1"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#deepWorkGradient)"
                        animationDuration={1000}
                    />
                    <Area
                        type="monotone"
                        dataKey="shallowWork"
                        stackId="1"
                        stroke="#6b7280"
                        strokeWidth={2}
                        fill="url(#shallowWorkGradient)"
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-400">Deep Work</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-sm text-gray-400">Shallow Work</span>
                </div>
            </div>
        </motion.div>
    )
}




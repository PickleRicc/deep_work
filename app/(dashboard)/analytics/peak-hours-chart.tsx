'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PeakHourData } from '@/lib/analytics'
import { motion } from 'motion/react'

interface PeakHoursChartProps {
    data: PeakHourData[]
}

export default function PeakHoursChart({ data }: PeakHoursChartProps) {
    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0]
            const hours = Math.floor(data.value / 60)
            const minutes = Math.round(data.value % 60)
            
            return (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-semibold mb-1">
                        {data.payload.hour}
                    </p>
                    <p className="text-gray-400 text-sm">
                        {hours > 0 && `${hours}h `}
                        {minutes > 0 && `${minutes}m`}
                    </p>
                </div>
            )
        }
        return null
    }

    // If no data, show empty state
    if (data.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
            >
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-1">Peak Hours</h2>
                    <p className="text-sm text-gray-400">Your most productive times</p>
                </div>
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <p>No peak hours data available yet</p>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Peak Hours</h2>
                <p className="text-sm text-gray-400">Your most productive times</p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                        dataKey="hour"
                        stroke="#52525b"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#52525b"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                            const hours = Math.floor(value / 60)
                            return hours > 0 ? `${hours}h` : `${value}m`
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey="minutes"
                        fill="url(#barGradient)"
                        radius={[8, 8, 0, 0]}
                        animationDuration={1000}
                    />
                </BarChart>
            </ResponsiveContainer>

            {/* Find peak hour */}
            {data.length > 0 && (() => {
                const peakHour = data.reduce((max, curr) => 
                    curr.minutes > max.minutes ? curr : max
                )
                return (
                    <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-sm text-purple-400">
                            <span className="font-semibold">Peak productivity:</span> {peakHour.hour}
                        </p>
                    </div>
                )
            })()}
        </motion.div>
    )
}




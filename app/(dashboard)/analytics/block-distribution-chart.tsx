'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { BlockDistribution } from '@/lib/analytics'
import { motion } from 'motion/react'

interface BlockDistributionChartProps {
    data: BlockDistribution[]
}

export default function BlockDistributionChart({ data }: BlockDistributionChartProps) {
    // Custom label for the donut
    const renderCustomLabel = (entry: any) => {
        return `${entry.percentage}%`
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0]
            return (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-semibold mb-1">
                        {data.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                        {data.value.toFixed(1)} hours
                    </p>
                    <p className="text-gray-400 text-sm">
                        {data.payload.percentage}% of total
                    </p>
                </div>
            )
        }
        return null
    }

    // Custom legend
    const renderLegend = (props: any) => {
        const { payload } = props
        return (
            <div className="flex flex-col gap-2 mt-4">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-gray-300">{entry.value}</span>
                        </div>
                        <span className="text-sm text-gray-400 font-mono">
                            {entry.payload.value.toFixed(1)}h
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    // If no data, show empty state
    if (data.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
            >
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-1">Time Distribution</h2>
                    <p className="text-sm text-gray-400">How you spend your time</p>
                </div>
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <p>No time blocks recorded yet</p>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Time Distribution</h2>
                <p className="text-sm text-gray-400">How you spend your time</p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={renderCustomLabel}
                        labelLine={false}
                        animationDuration={1000}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={renderLegend} />
                </PieChart>
            </ResponsiveContainer>
        </motion.div>
    )
}


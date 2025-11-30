'use client'

import { TaskReview, ProjectReview } from '@/lib/types/database'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface WorkSatisfactionChartProps {
    taskReviews: TaskReview[]
    projectReviews: ProjectReview[]
}

export default function WorkSatisfactionChart({ taskReviews, projectReviews }: WorkSatisfactionChartProps) {
    // Group reviews by week and calculate average enjoyment
    const weeklyData: Record<string, { enjoyment: number[], overall: number[], count: number }> = {}
    
    const allReviews = [...taskReviews, ...projectReviews]
    
    allReviews.forEach(review => {
        const date = new Date(review.created_at)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { enjoyment: [], overall: [], count: 0 }
        }
        
        weeklyData[weekKey].enjoyment.push(review.enjoyment_rating)
        weeklyData[weekKey].overall.push(review.overall_rating)
        weeklyData[weekKey].count++
    })
    
    // Convert to chart data
    const chartData = Object.entries(weeklyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12) // Last 12 weeks
        .map(([weekKey, data]) => {
            const avgEnjoyment = data.enjoyment.reduce((sum, val) => sum + val, 0) / data.enjoyment.length
            const avgOverall = data.overall.reduce((sum, val) => sum + val, 0) / data.overall.length
            
            return {
                week: new Date(weekKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                enjoyment: Number(avgEnjoyment.toFixed(1)),
                overall: Number(avgOverall.toFixed(1)),
                count: data.count,
            }
        })
    
    if (chartData.length === 0) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Work Satisfaction Trends</h3>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    Complete and review tasks to see satisfaction trends
                </div>
            </div>
        )
    }
    
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Work Satisfaction Trends</h3>
            <p className="text-sm text-gray-500 mb-6">Weekly average enjoyment and overall ratings</p>
            
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                        dataKey="week" 
                        stroke="#71717a"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                        stroke="#71717a"
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '8px',
                            color: '#fff',
                        }}
                        formatter={(value: number) => value.toFixed(1)}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="enjoyment"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Enjoyment"
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="overall"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Overall Rating"
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}


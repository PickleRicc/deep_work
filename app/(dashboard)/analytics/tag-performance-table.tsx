'use client'

import { TaskReview, ProjectReview } from '@/lib/types/database'
import { Tag, Zap, Star, TrendingUp } from 'lucide-react'

interface TagPerformanceTableProps {
    taskReviews: (TaskReview & { task?: { tags?: string[] | null } })[]
    projectReviews: (ProjectReview & { project?: { tags?: string[] | null } })[]
}

export default function TagPerformanceTable({ taskReviews, projectReviews }: TagPerformanceTableProps) {
    // Aggregate stats by tag
    const tagStats: Record<string, {
        count: number
        totalEnjoyment: number
        totalEnergy: number
        energyLevels: { low: number, medium: number, high: number }
    }> = {}

    const allReviews = [...taskReviews, ...projectReviews]
    
    allReviews.forEach((review) => {
        const tags = (review as any).task?.tags || (review as any).project?.tags || []
        
        tags.forEach((tag: string) => {
            if (!tagStats[tag]) {
                tagStats[tag] = {
                    count: 0,
                    totalEnjoyment: 0,
                    totalEnergy: 0,
                    energyLevels: { low: 0, medium: 0, high: 0 }
                }
            }

            tagStats[tag].count++
            tagStats[tag].totalEnjoyment += review.enjoyment_rating || 0
            
            const energy = review.energy_required
            if (energy === 'high') {
                tagStats[tag].totalEnergy += 3
                tagStats[tag].energyLevels.high++
            } else if (energy === 'medium') {
                tagStats[tag].totalEnergy += 2
                tagStats[tag].energyLevels.medium++
            } else {
                tagStats[tag].totalEnergy += 1
                tagStats[tag].energyLevels.low++
            }
        })
    })

    const sortedTags = Object.entries(tagStats)
        .filter(([_, stats]) => stats.count >= 2) // Only show tags with 2+ reviews
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10) // Top 10 tags

    if (sortedTags.length === 0) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Tag size={20} />
                    Tag Performance
                </h3>
                <div className="flex items-center justify-center h-40 text-gray-500">
                    Tag tasks and complete reviews to see performance by category
                </div>
            </div>
        )
    }

    const getEnergyLevel = (stats: typeof tagStats[string]) => {
        const avgEnergy = stats.totalEnergy / stats.count
        if (avgEnergy >= 2.5) return { label: 'High', color: 'text-orange-400' }
        if (avgEnergy >= 1.5) return { label: 'Medium', color: 'text-yellow-400' }
        return { label: 'Low', color: 'text-green-400' }
    }

    const getEnjoymentColor = (avgEnjoyment: number) => {
        if (avgEnjoyment >= 4) return 'text-green-400'
        if (avgEnjoyment >= 3) return 'text-blue-400'
        return 'text-gray-400'
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <Tag size={20} />
                Tag Performance Matrix
            </h3>
            <p className="text-sm text-gray-500 mb-6">How different types of work affect you</p>
            
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                                Tag
                            </th>
                            <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-2">
                                Count
                            </th>
                            <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-2">
                                <div className="flex items-center justify-center gap-1">
                                    <Star size={12} />
                                    Enjoyment
                                </div>
                            </th>
                            <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-2">
                                <div className="flex items-center justify-center gap-1">
                                    <Zap size={12} />
                                    Energy
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTags.map(([tag, stats]) => {
                            const avgEnjoyment = stats.totalEnjoyment / stats.count
                            const energyLevel = getEnergyLevel(stats)
                            
                            return (
                                <tr key={tag} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="py-3 pr-4">
                                        <span className="text-white font-medium">{tag}</span>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <span className="text-gray-400 text-sm">{stats.count}</span>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <span className={`font-medium ${getEnjoymentColor(avgEnjoyment)}`}>
                                            {avgEnjoyment.toFixed(1)}/5
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <span className={`text-sm font-medium ${energyLevel.color}`}>
                                            {energyLevel.label}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-6 pt-4 border-t border-zinc-800">
                <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <TrendingUp size={14} />
                    Key Insights
                </h4>
                <div className="space-y-1 text-sm text-gray-500">
                    {sortedTags[0] && (
                        <p>
                            • Most common: <span className="text-blue-400">{sortedTags[0][0]}</span> ({sortedTags[0][1].count} reviews)
                        </p>
                    )}
                    {sortedTags.find(([_, stats]) => stats.totalEnjoyment / stats.count >= 4) && (
                        <p>
                            • Highest enjoyment: <span className="text-green-400">
                                {sortedTags.filter(([_, stats]) => stats.totalEnjoyment / stats.count >= 4).map(([tag]) => tag).join(', ')}
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}



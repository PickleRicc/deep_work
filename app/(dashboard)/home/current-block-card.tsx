'use client'

import { motion } from 'motion/react'
import { Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { TimeBlock } from '@/lib/types/database'
import Link from 'next/link'

interface CurrentBlockCardProps {
    currentBlock: TimeBlock | undefined
    nextBlock: TimeBlock | undefined
    currentTime: string
}

export default function CurrentBlockCard({ currentBlock, nextBlock, currentTime }: CurrentBlockCardProps) {
    const getBlockTypeColor = (type: string) => {
        const colors = {
            deep_work: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
            shallow_work: 'from-gray-500/20 to-gray-600/10 border-gray-500/30 text-gray-400',
            break: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
            personal: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
            meeting: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
        }
        return colors[type as keyof typeof colors] || colors.deep_work
    }

    const getBlockTypeLabel = (type: string) => {
        return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }

    if (currentBlock) {
        const colors = getBlockTypeColor(currentBlock.block_type)
        const label = getBlockTypeLabel(currentBlock.block_type)

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br ${colors} border rounded-2xl p-6 backdrop-blur-sm`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock size={20} />
                        <span className="font-semibold">Currently Working</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-black/20 rounded-full">{label}</span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                    {currentBlock.task_title || 'Untitled Block'}
                </h3>

                <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono">{currentBlock.start_time.slice(0, 5)} - {currentBlock.end_time.slice(0, 5)}</span>
                    <span>•</span>
                    <span>{calculateDuration(currentBlock.start_time, currentBlock.end_time)} min</span>
                </div>

                {!currentBlock.completed && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <Link
                            href="/work?tab=block"
                            className="text-sm hover:underline flex items-center gap-1"
                        >
                            Mark as complete
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                )}
            </motion.div>
        )
    }

    if (nextBlock) {
        const colors = getBlockTypeColor(nextBlock.block_type)
        const label = getBlockTypeLabel(nextBlock.block_type)

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
            >
                <div className="flex items-center gap-2 text-gray-400 mb-4">
                    <Clock size={20} />
                    <span className="font-semibold">Next Up</span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                    {nextBlock.task_title || 'Untitled Block'}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="font-mono">{nextBlock.start_time.slice(0, 5)} - {nextBlock.end_time.slice(0, 5)}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded ${getBlockTypeColor(nextBlock.block_type)}`}>
                        {label}
                    </span>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800">
                    <Link
                        href="/work?tab=block"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                        View schedule
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="flex items-center gap-2 text-gray-400 mb-4">
                <Clock size={20} />
                <span className="font-semibold">No Blocks Scheduled</span>
            </div>

            <p className="text-gray-400 mb-4">
                You don't have any time blocks scheduled for today.
            </p>

            <Link
                href="/work?tab=block"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
                Plan your day
                <ArrowRight size={16} />
            </Link>
        </motion.div>
    )
}

function calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    return (endHour * 60 + endMin) - (startHour * 60 + startMin)
}


'use client'

import { useState } from 'react'
import { TimeBlock } from '@/lib/types/database'
import { motion, AnimatePresence } from 'motion/react'
import { X, ArrowRight, Zap, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import { format12Hour } from '@/lib/utils/date'

interface ScheduleOptimizerModalProps {
    currentBlocks: TimeBlock[]
    optimizedBlocks: TimeBlock[]
    issues: string[]
    currentScore: number
    optimizedScore: number
    onClose: () => void
    onApply: (blocks: TimeBlock[]) => void
}

export default function ScheduleOptimizerModal({
    currentBlocks,
    optimizedBlocks,
    issues,
    currentScore,
    optimizedScore,
    onClose,
    onApply
}: ScheduleOptimizerModalProps) {
    const [applying, setApplying] = useState(false)

    const handleApply = async () => {
        setApplying(true)
        await onApply(optimizedBlocks)
        setApplying(false)
    }

    const getBlockColor = (blockType: string) => {
        switch (blockType) {
            case 'deep_work':
                return 'bg-blue-500/20 border-blue-500/30 text-blue-300'
            case 'shallow_work':
                return 'bg-purple-500/20 border-purple-500/30 text-purple-300'
            case 'meeting':
                return 'bg-orange-500/20 border-orange-500/30 text-orange-300'
            case 'break':
                return 'bg-green-500/20 border-green-500/30 text-green-300'
            case 'personal':
                return 'bg-pink-500/20 border-pink-500/30 text-pink-300'
            default:
                return 'bg-zinc-500/20 border-zinc-500/30 text-zinc-300'
        }
    }

    const improvement = optimizedScore - currentScore

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Zap className="text-yellow-500" size={24} />
                            Schedule Optimization
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Review suggested improvements to your schedule
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Score Comparison */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                            <div className="text-sm text-gray-400 mb-1">Current Score</div>
                            <div className="text-3xl font-bold text-white">{currentScore}%</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4">
                            <div className="text-sm text-blue-300 mb-1">Optimized Score</div>
                            <div className="text-3xl font-bold text-white flex items-center gap-2">
                                {optimizedScore}%
                                <span className="text-sm text-green-400 flex items-center gap-1">
                                    <TrendingUp size={16} />
                                    +{improvement}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Issues Found */}
                    {issues.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-yellow-500" />
                                Issues Detected
                            </h3>
                            <div className="space-y-2">
                                {issues.map((issue, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 text-sm text-yellow-200"
                                    >
                                        {issue}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Before/After Comparison */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Current Schedule */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                                Current Schedule
                            </h3>
                            <div className="space-y-2">
                                {currentBlocks.map((block, idx) => (
                                    <motion.div
                                        key={block.id || idx}
                                        className={`border rounded-lg p-3 ${getBlockColor(block.block_type)}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">
                                                    {format12Hour(block.start_time)} - {format12Hour(block.end_time)}
                                                </div>
                                                <div className="text-xs mt-1 opacity-80">
                                                    {block.task_title || block.block_type}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Optimized Schedule */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                Optimized Schedule
                                <CheckCircle2 size={14} className="text-green-500" />
                            </h3>
                            <div className="space-y-2">
                                {optimizedBlocks.map((block, idx) => {
                                    const isChanged = currentBlocks[idx]?.task_title !== block.task_title ||
                                                      currentBlocks[idx]?.start_time !== block.start_time
                                    
                                    return (
                                        <motion.div
                                            key={block.id || idx}
                                            initial={isChanged ? { x: 20, opacity: 0 } : {}}
                                            animate={{ x: 0, opacity: 1 }}
                                            className={`border rounded-lg p-3 ${getBlockColor(block.block_type)} ${
                                                isChanged ? 'ring-2 ring-green-500/50' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                        {format12Hour(block.start_time)} - {format12Hour(block.end_time)}
                                                    </div>
                                                    <div className="text-xs mt-1 opacity-80">
                                                        {block.task_title || block.block_type}
                                                    </div>
                                                </div>
                                                {isChanged && (
                                                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Improvements Summary */}
                    <div className="mt-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-green-300 mb-2 flex items-center gap-2">
                            <TrendingUp size={16} />
                            Improvements
                        </h3>
                        <ul className="space-y-1 text-sm text-gray-300">
                            <li>✓ High-energy tasks moved to peak hours</li>
                            <li>✓ Similar work batched together</li>
                            <li>✓ Breaks added between intense blocks</li>
                            <li>✓ Better energy flow throughout the day</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-zinc-800 px-6 py-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors font-medium"
                    >
                        Keep Current
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={applying}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                        {applying ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Applying...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                Apply Optimization
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}


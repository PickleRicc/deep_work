'use client'

import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'

interface ProductivityScoreProps {
    score: number
}

export default function ProductivityScore({ score }: ProductivityScoreProps) {
    // Clamp score between 0 and 100
    const normalizedScore = Math.max(0, Math.min(100, score))
    
    // Calculate circle properties
    const radius = 80
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (normalizedScore / 100) * circumference

    // Get color based on score
    const getScoreColor = () => {
        if (normalizedScore >= 80) return { from: '#10b981', to: '#059669', text: 'text-green-400' }
        if (normalizedScore >= 60) return { from: '#3b82f6', to: '#2563eb', text: 'text-blue-400' }
        if (normalizedScore >= 40) return { from: '#f59e0b', to: '#d97706', text: 'text-orange-400' }
        return { from: '#ef4444', to: '#dc2626', text: 'text-red-400' }
    }

    const colors = getScoreColor()

    // Get performance level
    const getLevel = () => {
        if (normalizedScore >= 80) return 'Excellent'
        if (normalizedScore >= 60) return 'Great'
        if (normalizedScore >= 40) return 'Good'
        if (normalizedScore >= 20) return 'Fair'
        return 'Getting Started'
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Productivity Score</h2>
                <p className="text-sm text-gray-400">Overall performance metric</p>
            </div>

            <div className="flex flex-col items-center">
                {/* Circular Progress */}
                <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                        {/* Background circle */}
                        <circle
                            cx="96"
                            cy="96"
                            r={radius}
                            stroke="#27272a"
                            strokeWidth="12"
                            fill="none"
                        />
                        
                        {/* Progress circle */}
                        <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={colors.from} />
                                <stop offset="100%" stopColor={colors.to} />
                            </linearGradient>
                        </defs>
                        <motion.circle
                            cx="96"
                            cy="96"
                            r={radius}
                            stroke="url(#scoreGradient)"
                            strokeWidth="12"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            style={{
                                strokeDasharray: circumference,
                                filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
                            }}
                        />
                    </svg>

                    {/* Score text in center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                            className="text-center"
                        >
                            <div className={`text-5xl font-bold ${colors.text} mb-1`}>
                                {normalizedScore}
                            </div>
                            <div className="text-sm text-gray-500 font-medium">
                                out of 100
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Performance level */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full"
                >
                    <Sparkles size={16} className={colors.text} />
                    <span className={`font-semibold ${colors.text}`}>
                        {getLevel()}
                    </span>
                </motion.div>

                {/* Info text */}
                <p className="text-xs text-gray-500 text-center mt-4 max-w-xs">
                    Based on deep work hours, completed tasks, and consistency
                </p>
            </div>
        </motion.div>
    )
}


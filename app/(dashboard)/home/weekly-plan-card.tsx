'use client'

import { motion } from 'motion/react'
import { Target, ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'

interface WeeklyPlanCardProps {
    weeklyPlan: any | null
}

export default function WeeklyPlanCard({ weeklyPlan }: WeeklyPlanCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target size={20} className="text-purple-400" />
                    <h3 className="font-semibold text-white">This Week's Plan</h3>
                </div>
                <Link href="/work?tab=plan" className="text-sm text-blue-400 hover:text-blue-300">
                    Edit plan
                </Link>
            </div>

            {weeklyPlan && weeklyPlan.plan_text ? (
                <div className="max-h-48 overflow-y-auto scrollbar-hide">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {weeklyPlan.plan_text.length > 300
                            ? weeklyPlan.plan_text.slice(0, 300) + '...'
                            : weeklyPlan.plan_text}
                    </pre>
                    {weeklyPlan.plan_text.length > 300 && (
                        <Link
                            href="/work?tab=plan"
                            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-3"
                        >
                            Read more
                            <ArrowRight size={14} />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-4">
                        No weekly plan set yet
                    </p>
                    <Link
                        href="/work?tab=plan"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-medium hover:bg-purple-600/30 transition-colors"
                    >
                        <Plus size={16} />
                        Create weekly plan
                    </Link>
                </div>
            )}
        </motion.div>
    )
}




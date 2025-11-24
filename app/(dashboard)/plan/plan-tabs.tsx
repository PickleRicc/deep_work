'use client'

import { QuarterlyPlan, WeeklyPlan } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import {
    Target,
    Calendar,
    Plus,
    Pencil,
    X,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Layout
} from 'lucide-react'

interface PlanTabsProps {
    quarterlyPlan: QuarterlyPlan | null
    weeklyPlan: WeeklyPlan | null
    currentQuarter: string
    weekStart: string
}

type TabType = 'quarterly' | 'weekly'

export function PlanTabs({ quarterlyPlan, weeklyPlan, currentQuarter, weekStart }: PlanTabsProps) {
    const router = useRouter()
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<TabType>('quarterly')

    // Quarterly State
    const [isCreatingQuarterly, setIsCreatingQuarterly] = useState(false)
    const [isEditingQuarterly, setIsEditingQuarterly] = useState(false)
    const [quarterlyObjectives, setQuarterlyObjectives] = useState(['', '', ''])

    // Weekly State
    const [isCreatingWeekly, setIsCreatingWeekly] = useState(false)
    const [isEditingWeekly, setIsEditingWeekly] = useState(false)
    const [weeklyPlanText, setWeeklyPlanText] = useState('')

    // QUARTERLY HANDLERS
    const handleCreateQuarterlyPlan = async () => {
        const validObjectives = quarterlyObjectives.filter(obj => obj.trim())
        if (validObjectives.length === 0) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
            .from('quarterly_plans')
            .insert({
                user_id: user.id,
                quarter: currentQuarter,
                objectives: validObjectives
            })

        setQuarterlyObjectives(['', '', ''])
        setIsCreatingQuarterly(false)
        router.refresh()
    }

    const startEditingQuarterly = () => {
        if (quarterlyPlan) {
            setQuarterlyObjectives([...quarterlyPlan.objectives])
            setIsEditingQuarterly(true)
        }
    }

    const handleUpdateQuarterlyPlan = async () => {
        if (!quarterlyPlan) return
        const validObjectives = quarterlyObjectives.filter(obj => obj.trim())
        if (validObjectives.length === 0) return

        await supabase
            .from('quarterly_plans')
            .update({
                objectives: validObjectives
            })
            .eq('id', quarterlyPlan.id)

        setIsEditingQuarterly(false)
        router.refresh()
    }

    const addObjectiveField = () => {
        setQuarterlyObjectives([...quarterlyObjectives, ''])
    }

    const updateObjective = (index: number, value: string) => {
        const updated = [...quarterlyObjectives]
        updated[index] = value
        setQuarterlyObjectives(updated)
    }

    const removeObjective = (index: number) => {
        setQuarterlyObjectives(quarterlyObjectives.filter((_, i) => i !== index))
    }

    // WEEKLY HANDLERS
    const handleCreateWeeklyPlan = async () => {
        if (!weeklyPlanText.trim()) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
            .from('weekly_plans')
            .insert({
                user_id: user.id,
                week_start: weekStart,
                plan_text: weeklyPlanText,
                quarterly_plan_id: quarterlyPlan?.id || null
            })

        setWeeklyPlanText('')
        setIsCreatingWeekly(false)
        router.refresh()
    }

    const startEditingWeekly = () => {
        if (weeklyPlan) {
            setWeeklyPlanText(weeklyPlan.plan_text)
            setIsEditingWeekly(true)
        }
    }

    const handleUpdateWeeklyPlan = async () => {
        if (!weeklyPlan || !weeklyPlanText.trim()) return

        await supabase
            .from('weekly_plans')
            .update({
                plan_text: weeklyPlanText
            })
            .eq('id', weeklyPlan.id)

        setIsEditingWeekly(false)
        router.refresh()
    }

    const formatWeekStart = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
    }

    // Extract quarter display name (e.g., "Q4 2024")
    const quarterDisplay = quarterlyPlan?.quarter || currentQuarter

    return (
        <div className="space-y-8">
            {/* TAB BUTTONS */}
            <div className="flex p-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl">
                <button
                    onClick={() => setActiveTab('quarterly')}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'quarterly'
                        ? 'bg-zinc-800 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Target size={18} className={activeTab === 'quarterly' ? 'text-blue-400' : ''} />
                    Quarterly
                </button>
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'weekly'
                        ? 'bg-zinc-800 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Calendar size={18} className={activeTab === 'weekly' ? 'text-blue-400' : ''} />
                    This Week
                </button>
            </div>

            {/* TAB CONTENT */}
            <AnimatePresence mode="wait">
                {activeTab === 'quarterly' ? (
                    <motion.div
                        key="quarterly"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Target className="text-blue-500" size={28} />
                                    {quarterDisplay}
                                </h3>
                                <p className="text-gray-400 mt-1 ml-10">Strategic Objectives</p>
                            </div>
                            {!quarterlyPlan && !isCreatingQuarterly && (
                                <button
                                    onClick={() => setIsCreatingQuarterly(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    <Plus size={18} /> Create Plan
                                </button>
                            )}
                            {quarterlyPlan && !isEditingQuarterly && (
                                <button
                                    onClick={startEditingQuarterly}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-zinc-700"
                                >
                                    <Pencil size={16} /> Edit
                                </button>
                            )}
                        </div>

                        {isCreatingQuarterly || isEditingQuarterly ? (
                            <div className="space-y-6">
                                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <Sparkles className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                                    <p className="text-blue-200 text-sm">
                                        {isEditingQuarterly ? 'Refine your strategic focus.' : `Set 3-5 ambitious objectives for ${quarterDisplay}. Focus on outcomes, not just outputs.`}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {quarterlyObjectives.map((objective, index) => (
                                        <div key={index} className="flex gap-3 group">
                                            <div className="w-8 h-10 flex items-center justify-center bg-zinc-800 rounded-lg text-gray-500 font-mono text-sm">
                                                {index + 1}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Enter a strategic objective..."
                                                value={objective}
                                                onChange={(e) => updateObjective(index, e.target.value)}
                                                className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:bg-zinc-800 transition-all"
                                                autoFocus={index === quarterlyObjectives.length - 1}
                                            />
                                            {quarterlyObjectives.length > 1 && (
                                                <button
                                                    onClick={() => removeObjective(index)}
                                                    className="w-10 h-10 flex items-center justify-center bg-zinc-800/50 hover:bg-red-900/20 text-gray-500 hover:text-red-400 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {quarterlyObjectives.length < 5 && (
                                    <button
                                        onClick={addObjectiveField}
                                        className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-blue-900/10 transition-colors"
                                    >
                                        <Plus size={16} /> Add another objective
                                    </button>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                                    <button
                                        onClick={() => {
                                            if (isEditingQuarterly) {
                                                setIsEditingQuarterly(false)
                                            } else {
                                                setIsCreatingQuarterly(false)
                                                setQuarterlyObjectives(['', '', ''])
                                            }
                                        }}
                                        className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-xl transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={isEditingQuarterly ? handleUpdateQuarterlyPlan : handleCreateQuarterlyPlan}
                                        disabled={quarterlyObjectives.filter(o => o.trim()).length === 0}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-gray-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                                    >
                                        {isEditingQuarterly ? 'Update Plan' : 'Save Quarterly Plan'}
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : quarterlyPlan && quarterlyPlan.objectives && Array.isArray(quarterlyPlan.objectives) && quarterlyPlan.objectives.length > 0 ? (
                            <motion.div
                                className="space-y-4"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.1,
                                        },
                                    },
                                }}
                            >
                                {quarterlyPlan.objectives.map((objective, index) => (
                                    <motion.div
                                        key={index}
                                        variants={{
                                            hidden: { opacity: 0, x: -20 },
                                            visible: { opacity: 1, x: 0 },
                                        }}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-800 hover:border-zinc-700 transition-colors group"
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center bg-blue-500/10 text-blue-400 rounded-lg font-bold text-sm border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                            {index + 1}
                                        </div>
                                        <p className="text-gray-200 text-lg flex-1 leading-relaxed">
                                            {objective}
                                        </p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-600">
                                    <Target size={40} />
                                </div>
                                <h4 className="text-xl font-semibold text-white mb-2">No quarterly plan yet</h4>
                                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                    Set your strategic direction for {quarterDisplay} to guide your weekly and daily actions.
                                </p>
                                <Link
                                    href="/chat"
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    <Sparkles size={18} /> Ask Claude to Create Plan
                                </Link>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="weekly"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Calendar className="text-blue-500" size={28} />
                                    This Week
                                </h3>
                                <p className="text-gray-400 mt-1 ml-10">
                                    Week of {formatWeekStart(weekStart)}
                                </p>
                            </div>
                            {!weeklyPlan && !isCreatingWeekly && (
                                <button
                                    onClick={() => setIsCreatingWeekly(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    <Plus size={18} /> Create Plan
                                </button>
                            )}
                            {weeklyPlan && !isEditingWeekly && (
                                <button
                                    onClick={startEditingWeekly}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-zinc-700"
                                >
                                    <Pencil size={16} /> Edit
                                </button>
                            )}
                        </div>

                        {isCreatingWeekly || isEditingWeekly ? (
                            <div className="space-y-6">
                                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <Layout className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                                    <p className="text-blue-200 text-sm">
                                        Plan your week based on your quarterly goals. What are the key outcomes you need to achieve?
                                    </p>
                                </div>

                                <textarea
                                    placeholder="Enter your weekly plan..."
                                    value={weeklyPlanText}
                                    onChange={(e) => setWeeklyPlanText(e.target.value)}
                                    rows={12}
                                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:bg-zinc-800 transition-all resize-none font-sans text-lg leading-relaxed"
                                    autoFocus
                                />

                                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                                    <button
                                        onClick={() => {
                                            if (isEditingWeekly) {
                                                setIsEditingWeekly(false)
                                            } else {
                                                setIsCreatingWeekly(false)
                                                setWeeklyPlanText('')
                                            }
                                        }}
                                        className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-xl transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={isEditingWeekly ? handleUpdateWeeklyPlan : handleCreateWeeklyPlan}
                                        disabled={!weeklyPlanText.trim()}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-gray-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                                    >
                                        {isEditingWeekly ? 'Update Plan' : 'Save Weekly Plan'}
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : weeklyPlan && weeklyPlan.plan_text ? (
                            <div className="prose prose-invert max-w-none">
                                <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-8">
                                    <pre className="whitespace-pre-wrap text-gray-200 font-sans text-lg leading-relaxed">
                                        {weeklyPlan.plan_text}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-600">
                                    <Calendar size={40} />
                                </div>
                                <h4 className="text-xl font-semibold text-white mb-2">No weekly plan yet</h4>
                                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                    Break down your quarterly objectives into actionable weekly goals.
                                </p>
                                <Link
                                    href="/chat"
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    <Sparkles size={18} /> Ask Claude to Create Plan
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

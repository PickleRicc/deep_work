'use client'

import { useState } from 'react'
import { Task, Project, Difficulty, ValueImpact, EnergyLevel } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'motion/react'
import { X, Star, Zap, TrendingUp, Brain, ThumbsUp } from 'lucide-react'

interface ReviewModalProps {
    item: Task | Project
    itemType: 'task' | 'project'
    onClose: () => void
    onSubmit: () => void
}

export default function ReviewModal({ item, itemType, onClose, onSubmit }: ReviewModalProps) {
    const [overallRating, setOverallRating] = useState(3)
    const [difficulty, setDifficulty] = useState<Difficulty>('medium')
    const [enjoymentRating, setEnjoymentRating] = useState(3)
    const [valueImpact, setValueImpact] = useState<ValueImpact>('medium')
    const [energyRequired, setEnergyRequired] = useState<EnergyLevel>('medium')
    const [whatMadeHard, setWhatMadeHard] = useState('')
    const [whatWasFun, setWhatWasFun] = useState('')
    const [conceptsDisliked, setConceptsDisliked] = useState('')
    const [wouldDoAgain, setWouldDoAgain] = useState<boolean | null>(null)
    const [saving, setSaving] = useState(false)

    const itemName = itemType === 'task' ? (item as Task).title : (item as Project).project_name

    const handleSubmit = async () => {
        setSaving(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            setSaving(false)
            return
        }

        const reviewData = {
            user_id: user.id,
            [`${itemType}_id`]: item.id,
            overall_rating: overallRating,
            difficulty,
            enjoyment_rating: enjoymentRating,
            value_impact: valueImpact,
            energy_required: energyRequired,
            what_made_hard: whatMadeHard || null,
            what_was_fun: whatWasFun || null,
            concepts_disliked: conceptsDisliked || null,
            would_do_again: wouldDoAgain,
        }

        const { error } = await supabase
            .from(`${itemType}_reviews`)
            .insert(reviewData)

        setSaving(false)

        if (!error) {
            onSubmit()
        } else {
            alert('Failed to save review. Please try again.')
        }
    }

    const renderStars = (rating: number, setRating: (rating: number) => void) => {
        return (
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-all duration-200 hover:scale-110"
                    >
                        <Star
                            size={32}
                            className={`${
                                star <= rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-gray-600'
                            }`}
                        />
                    </button>
                ))}
            </div>
        )
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                🎉 {itemType === 'task' ? 'Task' : 'Project'} Completed!
                            </h2>
                            <p className="text-gray-400 mt-1">{itemName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Overall Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                <ThumbsUp size={18} />
                                Overall Rating
                            </label>
                            {renderStars(overallRating, setOverallRating)}
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                <Brain size={18} />
                                Difficulty
                            </label>
                            <div className="flex gap-3">
                                {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setDifficulty(level)}
                                        className={`
                                            flex-1 py-3 rounded-lg font-medium transition-all capitalize
                                            ${difficulty === level
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                            }
                                        `}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Enjoyment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                <Star size={18} />
                                How much did you enjoy this?
                            </label>
                            {renderStars(enjoymentRating, setEnjoymentRating)}
                        </div>

                        {/* Value/Impact */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                <TrendingUp size={18} />
                                Value / Impact
                            </label>
                            <div className="flex gap-3">
                                {(['low', 'medium', 'high'] as ValueImpact[]).map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setValueImpact(level)}
                                        className={`
                                            flex-1 py-3 rounded-lg font-medium transition-all capitalize
                                            ${valueImpact === level
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                            }
                                        `}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Energy Required */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                <Zap size={18} />
                                Energy Required
                            </label>
                            <div className="flex gap-3">
                                {(['low', 'medium', 'high'] as EnergyLevel[]).map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setEnergyRequired(level)}
                                        className={`
                                            flex-1 py-3 rounded-lg font-medium transition-all capitalize
                                            ${energyRequired === level
                                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30'
                                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                            }
                                        `}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text Feedback - Collapsible */}
                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <p className="text-sm text-gray-500">Optional: Share more details</p>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">
                                    What made it challenging?
                                </label>
                                <textarea
                                    value={whatMadeHard}
                                    onChange={(e) => setWhatMadeHard(e.target.value)}
                                    rows={2}
                                    placeholder="Technical complexity, unclear requirements, etc."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">
                                    What did you enjoy about it?
                                </label>
                                <textarea
                                    value={whatWasFun}
                                    onChange={(e) => setWhatWasFun(e.target.value)}
                                    rows={2}
                                    placeholder="Learning something new, creative freedom, etc."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">
                                    Concepts or aspects you disliked?
                                </label>
                                <textarea
                                    value={conceptsDisliked}
                                    onChange={(e) => setConceptsDisliked(e.target.value)}
                                    rows={2}
                                    placeholder="Repetitive work, tedious details, etc."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">
                                    Would you do similar work again?
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setWouldDoAgain(true)}
                                        className={`
                                            flex-1 py-3 rounded-lg font-medium transition-all
                                            ${wouldDoAgain === true
                                                ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                            }
                                        `}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWouldDoAgain(false)}
                                        className={`
                                            flex-1 py-3 rounded-lg font-medium transition-all
                                            ${wouldDoAgain === false
                                                ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                            }
                                        `}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors font-medium"
                        >
                            Skip for now
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-900/20"
                        >
                            {saving ? 'Saving...' : 'Submit Review'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}


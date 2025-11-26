'use client'

import { motion } from 'motion/react'
import { CheckCircle2, Circle, Pencil, Trash2, Calendar } from 'lucide-react'
import { Behavior, BehaviorCheckin } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getLocalDateString } from '@/lib/utils/date'

interface BehaviorListProps {
    behaviors: Behavior[]
    checkins: BehaviorCheckin[]
    isRewarding: boolean
    onEdit: (behavior: Behavior) => void
    onUpdate: (behaviors: Behavior[], checkins: BehaviorCheckin[]) => void
}

export default function BehaviorList({ behaviors, checkins, isRewarding, onEdit, onUpdate }: BehaviorListProps) {
    const router = useRouter()
    const supabase = createClient()
    const [checkingIn, setCheckingIn] = useState<string | null>(null)

    const today = getLocalDateString()

    const handleQuickCheckin = async (behaviorId: string) => {
        setCheckingIn(behaviorId)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Check if already checked in today
            const existing = checkins.find(
                (c) => c.behavior_id === behaviorId && c.date === today
            )

            if (existing) {
                // Toggle completion
                await supabase
                    .from('behavior_checkins')
                    .update({ completed: !existing.completed })
                    .eq('id', existing.id)
            } else {
                // Create new checkin
                await supabase.from('behavior_checkins').insert({
                    behavior_id: behaviorId,
                    user_id: user.id,
                    date: today,
                    completed: true,
                })
            }

            // Refresh data
            const { data: updatedCheckins } = await supabase
                .from('behavior_checkins')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            const { data: updatedBehaviors } = await supabase
                .from('behaviors')
                .select('*')
                .eq('user_id', user.id)

            onUpdate(updatedBehaviors || behaviors, updatedCheckins || checkins)
            router.refresh()
        } catch (error) {
            console.error('Error checking in:', error)
        } finally {
            setCheckingIn(null)
        }
    }

    const handleDelete = async (behaviorId: string) => {
        if (!confirm('Delete this behavior?')) return

        try {
            await supabase.from('behaviors').delete().eq('id', behaviorId)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: updatedBehaviors } = await supabase
                .from('behaviors')
                .select('*')
                .eq('user_id', user.id)

            onUpdate(updatedBehaviors || [], checkins)
            router.refresh()
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const isCheckedInToday = (behaviorId: string) => {
        return checkins.some((c) => c.behavior_id === behaviorId && c.date === today && c.completed)
    }

    const getStreak = (behaviorId: string) => {
        const behaviorCheckins = checkins
            .filter((c) => c.behavior_id === behaviorId && c.completed)
            .sort((a, b) => b.date.localeCompare(a.date))

        if (behaviorCheckins.length === 0) return 0

        let streak = 0
        const checkDate = new Date()

        for (const checkin of behaviorCheckins) {
            const checkinDate = new Date(checkin.date + 'T00:00:00')
            checkDate.setHours(0, 0, 0, 0)

            const diffDays = Math.floor((checkDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays === streak) {
                streak++
            } else {
                break
            }
        }

        return streak
    }

    if (behaviors.length === 0) {
        return (
            <div className="text-center py-8 bg-zinc-900/30 border border-zinc-800 rounded-xl">
                <p className="text-gray-500">No behaviors yet</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {behaviors.map((behavior) => {
                const checkedIn = isCheckedInToday(behavior.id)
                const streak = getStreak(behavior.id)

                return (
                    <motion.div
                        key={behavior.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group bg-zinc-900/30 backdrop-blur-sm border rounded-xl p-4 transition-all ${
                            isRewarding
                                ? 'border-green-500/20 hover:border-green-500/40'
                                : 'border-red-500/20 hover:border-red-500/40'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold text-white">
                                        {behavior.behavior_name}
                                    </h3>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                            isRewarding
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}
                                    >
                                        {behavior.frequency}
                                    </span>
                                </div>

                                {behavior.description && (
                                    <p className="text-sm text-gray-400 mb-2">{behavior.description}</p>
                                )}

                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    {behavior.category && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {behavior.category}
                                        </span>
                                    )}
                                    {streak > 0 && (
                                        <span className="text-orange-400 font-semibold">
                                            🔥 {streak} day streak
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {behavior.frequency === 'daily' && (
                                    <button
                                        onClick={() => handleQuickCheckin(behavior.id)}
                                        disabled={checkingIn === behavior.id}
                                        className={`p-2 rounded-lg transition-all ${
                                            checkedIn
                                                ? isRewarding
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                : 'bg-zinc-800 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {checkingIn === behavior.id ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : checkedIn ? (
                                            <CheckCircle2 size={20} />
                                        ) : (
                                            <Circle size={20} />
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={() => onEdit(behavior)}
                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 text-gray-400 hover:text-white rounded-lg transition-all"
                                >
                                    <Pencil size={16} />
                                </button>

                                <button
                                    onClick={() => handleDelete(behavior.id)}
                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-900/20 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}


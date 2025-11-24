'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { X, Save } from 'lucide-react'
import { Behavior, BehaviorCheckin } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface BehaviorFormProps {
    behavior: Behavior
    onClose: () => void
    onSave: (behaviors: Behavior[], checkins: BehaviorCheckin[]) => void
}

export default function BehaviorForm({ behavior, onClose, onSave }: BehaviorFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isSaving, setIsSaving] = useState(false)

    const [behaviorName, setBehaviorName] = useState(behavior.behavior_name)
    const [description, setDescription] = useState(behavior.description || '')
    const [frequency, setFrequency] = useState(behavior.frequency)
    const [category, setCategory] = useState(behavior.category || '')
    const [isRewarding, setIsRewarding] = useState(behavior.is_rewarding)

    const handleSave = async () => {
        if (!behaviorName.trim()) return

        setIsSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const behaviorData = {
                user_id: user.id,
                behavior_name: behaviorName,
                description: description || null,
                frequency,
                is_rewarding: isRewarding,
                category: category || null,
                updated_at: new Date().toISOString(),
            }

            if (behavior.id) {
                // Update existing behavior
                await supabase
                    .from('behaviors')
                    .update(behaviorData)
                    .eq('id', behavior.id)
            } else {
                // Create new behavior
                await supabase.from('behaviors').insert(behaviorData)
            }

            // Fetch updated data
            const { data: updatedBehaviors } = await supabase
                .from('behaviors')
                .select('*')
                .eq('user_id', user.id)
                .order('behavior_name', { ascending: true })

            const { data: updatedCheckins } = await supabase
                .from('behavior_checkins')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            onSave((updatedBehaviors as Behavior[]) || [], (updatedCheckins as BehaviorCheckin[]) || [])
            router.refresh()
        } catch (error) {
            console.error('Error saving behavior:', error)
            alert('Failed to save behavior')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-2xl font-bold text-white">
                        {behavior.id ? 'Edit Behavior' : 'New Behavior'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Behavior Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                            BEHAVIOR NAME
                        </label>
                        <input
                            type="text"
                            value={behaviorName}
                            onChange={(e) => setBehaviorName(e.target.value)}
                            placeholder="e.g., Morning workout, Read for 30 minutes..."
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                            DESCRIPTION (OPTIONAL)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this behavior involve?"
                            rows={3}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Frequency and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">
                                FREQUENCY
                            </label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as any)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">
                                CATEGORY
                            </label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g., Health, Work..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Rewarding Toggle */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-3">
                            DOES THIS BEHAVIOR REWARD YOU?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsRewarding(true)}
                                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                                    isRewarding
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : 'bg-zinc-800 text-gray-400 hover:text-white'
                                }`}
                            >
                                ✓ Yes, Rewards Me
                            </button>
                            <button
                                onClick={() => setIsRewarding(false)}
                                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                                    !isRewarding
                                        ? 'bg-red-500 text-white shadow-lg'
                                        : 'bg-zinc-800 text-gray-400 hover:text-white'
                                }`}
                            >
                                ✗ No, Doesn't Reward Me
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!behaviorName.trim() || isSaving}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save Behavior'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}


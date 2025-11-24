'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { TrendingUp, TrendingDown, Plus, Filter } from 'lucide-react'
import { Behavior, BehaviorCheckin } from '@/lib/types/database'
import BehaviorList from './behavior-list'
import BehaviorForm from './behavior-form'

interface BehaviorManagerProps {
    initialBehaviors: Behavior[]
    initialCheckins: BehaviorCheckin[]
}

export default function BehaviorManager({ initialBehaviors, initialCheckins }: BehaviorManagerProps) {
    const [behaviors, setBehaviors] = useState<Behavior[]>(initialBehaviors)
    const [checkins, setCheckins] = useState<BehaviorCheckin[]>(initialCheckins)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingBehavior, setEditingBehavior] = useState<Behavior | null>(null)
    const [filterFrequency, setFilterFrequency] = useState<string>('all')

    const rewardingBehaviors = behaviors.filter((b) => b.is_rewarding)
    const nonRewardingBehaviors = behaviors.filter((b) => !b.is_rewarding)

    const handleAddBehavior = (rewarding: boolean) => {
        setEditingBehavior({
            id: '',
            user_id: '',
            behavior_name: '',
            description: null,
            frequency: 'daily',
            is_rewarding: rewarding,
            category: null,
            created_at: '',
            updated_at: '',
        } as Behavior)
        setIsFormOpen(true)
    }

    const handleEditBehavior = (behavior: Behavior) => {
        setEditingBehavior(behavior)
        setIsFormOpen(true)
    }

    const handleBehaviorsSaved = (updatedBehaviors: Behavior[], updatedCheckins: BehaviorCheckin[]) => {
        setBehaviors(updatedBehaviors)
        setCheckins(updatedCheckins)
        setIsFormOpen(false)
        setEditingBehavior(null)
    }

    // Filter behaviors by frequency
    const filterBehaviors = (behaviorList: Behavior[]) => {
        if (filterFrequency === 'all') return behaviorList
        return behaviorList.filter((b) => b.frequency === filterFrequency)
    }

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/20 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="text-green-400" size={24} />
                            Rewards Me
                        </h3>
                        <button
                            onClick={() => handleAddBehavior(true)}
                            className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="text-4xl font-bold text-green-400 mb-2">
                        {rewardingBehaviors.length}
                    </div>
                    <p className="text-sm text-gray-400">
                        Behaviors that serve you well
                    </p>
                </div>

                <div className="bg-gradient-to-br from-red-900/20 to-orange-900/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingDown className="text-red-400" size={24} />
                            Doesn't Reward Me
                        </h3>
                        <button
                            onClick={() => handleAddBehavior(false)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="text-4xl font-bold text-red-400 mb-2">
                        {nonRewardingBehaviors.length}
                    </div>
                    <p className="text-sm text-gray-400">
                        Behaviors to eliminate
                    </p>
                </div>
            </div>

            {/* Frequency Filter */}
            <div className="flex items-center gap-3">
                <Filter size={18} className="text-gray-500" />
                <span className="text-sm text-gray-500">Filter by frequency:</span>
                <div className="flex gap-2">
                    {['all', 'daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
                        <button
                            key={freq}
                            onClick={() => setFilterFrequency(freq)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filterFrequency === freq
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-zinc-900/50 text-gray-400 hover:text-white'
                            }`}
                        >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Behavior Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rewarding Behaviors */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Rewards Me
                    </h2>
                    <BehaviorList
                        behaviors={filterBehaviors(rewardingBehaviors)}
                        checkins={checkins}
                        isRewarding={true}
                        onEdit={handleEditBehavior}
                        onUpdate={handleBehaviorsSaved}
                    />
                </div>

                {/* Non-Rewarding Behaviors */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                        <TrendingDown size={20} />
                        Doesn't Reward Me
                    </h2>
                    <BehaviorList
                        behaviors={filterBehaviors(nonRewardingBehaviors)}
                        checkins={checkins}
                        isRewarding={false}
                        onEdit={handleEditBehavior}
                        onUpdate={handleBehaviorsSaved}
                    />
                </div>
            </div>

            {/* Behavior Form Modal */}
            {isFormOpen && editingBehavior && (
                <BehaviorForm
                    behavior={editingBehavior}
                    onClose={() => {
                        setIsFormOpen(false)
                        setEditingBehavior(null)
                    }}
                    onSave={handleBehaviorsSaved}
                />
            )}
        </div>
    )
}


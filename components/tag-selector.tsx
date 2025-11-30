'use client'

import { useState, useEffect } from 'react'
import { WorkTag } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'motion/react'
import { Check } from 'lucide-react'

interface TagSelectorProps {
    selectedTags: string[]
    onChange: (tags: string[]) => void
    maxTags?: number
    label?: string
}

export default function TagSelector({ selectedTags, onChange, maxTags, label = "Tags" }: TagSelectorProps) {
    const [availableTags, setAvailableTags] = useState<WorkTag[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTags() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('work_tags')
                .select('*')
                .order('tag_name')

            if (!error && data) {
                setAvailableTags(data)
            }
            setLoading(false)
        }

        fetchTags()
    }, [])

    const toggleTag = (tagName: string) => {
        if (selectedTags.includes(tagName)) {
            onChange(selectedTags.filter(t => t !== tagName))
        } else {
            if (maxTags && selectedTags.length >= maxTags) {
                return // Don't allow more than maxTags
            }
            onChange([...selectedTags, tagName])
        }
    }

    const getCategoryColor = (category: string | null) => {
        switch (category) {
            case 'work_type':
                return 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300'
            case 'enjoyment':
                return 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-300'
            case 'energy_level':
                return 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-300'
            default:
                return 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-300'
        }
    }

    if (loading) {
        return (
            <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {label}
                </label>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                    Loading tags...
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                {label}
                {maxTags && (
                    <span className="ml-2 text-gray-600 font-normal">
                        ({selectedTags.length}/{maxTags})
                    </span>
                )}
            </label>
            
            <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                    {availableTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.tag_name)
                        const colorClass = getCategoryColor(tag.tag_category)
                        
                        return (
                            <motion.button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.tag_name)}
                                layout
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative px-3 py-1.5 rounded-lg border font-medium text-sm
                                    transition-all duration-200
                                    ${isSelected 
                                        ? `bg-gradient-to-r ${colorClass} shadow-lg` 
                                        : 'bg-zinc-800/50 border-zinc-700 text-gray-400 hover:border-zinc-600'
                                    }
                                `}
                            >
                                <span className="flex items-center gap-1.5">
                                    {tag.tag_name}
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Check size={14} />
                                        </motion.div>
                                    )}
                                </span>
                            </motion.button>
                        )
                    })}
                </AnimatePresence>
            </div>

            {selectedTags.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-gray-600">Selected:</span>
                    <div className="flex flex-wrap gap-1.5">
                        {selectedTags.map((tagName) => {
                            const tag = availableTags.find(t => t.tag_name === tagName)
                            if (!tag) return null
                            
                            return (
                                <span
                                    key={tagName}
                                    className={`
                                        px-2 py-0.5 rounded text-xs font-medium
                                        bg-gradient-to-r ${getCategoryColor(tag.tag_category)}
                                    `}
                                >
                                    {tagName}
                                </span>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}


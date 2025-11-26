'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, X, Save, Settings, Copy } from 'lucide-react'
import { UserWorkHours } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface WorkHoursConfigProps {
    userId: string
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
]

export default function WorkHoursConfig({ userId }: WorkHoursConfigProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [workHours, setWorkHours] = useState<UserWorkHours[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [copyFromDay, setCopyFromDay] = useState<number | null>(null)
    const [selectedDaysToCopy, setSelectedDaysToCopy] = useState<number[]>([])
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            loadWorkHours()
        }
    }, [isOpen])

    async function loadWorkHours() {
        const { data } = await supabase
            .from('user_work_hours')
            .select('*')
            .eq('user_id', userId)
            .order('day_of_week')

        if (data && data.length > 0) {
            setWorkHours(data)
        } else {
            // Create default work hours if none exist
            const defaultHours = DAYS_OF_WEEK.map(day => ({
                id: '',
                user_id: userId,
                day_of_week: day.value,
                start_time: '09:00:00',
                end_time: '17:00:00',
                is_enabled: day.value >= 1 && day.value <= 5, // Mon-Fri enabled
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }))
            setWorkHours(defaultHours)
        }
    }

    const handleToggleDay = (dayIndex: number) => {
        setWorkHours(prev => prev.map((wh, idx) => 
            idx === dayIndex ? { ...wh, is_enabled: !wh.is_enabled } : wh
        ))
    }

    const handleTimeChange = (dayIndex: number, field: 'start_time' | 'end_time', value: string) => {
        setWorkHours(prev => prev.map((wh, idx) => 
            idx === dayIndex ? { ...wh, [field]: value + ':00' } : wh
        ))
    }

    const handleCopyToDays = (sourceDayIndex: number, targetDayIndices: number[]) => {
        const sourceDay = workHours[sourceDayIndex]
        setWorkHours(prev => prev.map((wh, idx) => 
            targetDayIndices.includes(idx)
                ? { 
                    ...wh, 
                    start_time: sourceDay.start_time,
                    end_time: sourceDay.end_time,
                    is_enabled: sourceDay.is_enabled
                }
                : wh
        ))
        setCopyFromDay(null)
        setSelectedDaysToCopy([])
    }

    const toggleDayToCopy = (dayIndex: number) => {
        setSelectedDaysToCopy(prev => 
            prev.includes(dayIndex)
                ? prev.filter(idx => idx !== dayIndex)
                : [...prev, dayIndex]
        )
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Delete existing work hours
            await supabase
                .from('user_work_hours')
                .delete()
                .eq('user_id', userId)

            // Insert new work hours
            const { error } = await supabase
                .from('user_work_hours')
                .insert(workHours.map(wh => ({
                    user_id: userId,
                    day_of_week: wh.day_of_week,
                    start_time: wh.start_time,
                    end_time: wh.end_time,
                    is_enabled: wh.is_enabled,
                })))

            if (error) {
                console.error('Error saving work hours:', error)
                alert('Failed to save work hours')
            } else {
                setIsOpen(false)
                router.refresh()
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/30 text-gray-400 hover:text-blue-400 transition-colors text-sm"
            >
                <Settings size={16} />
                <span className="hidden md:inline">Work Hours</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        />

                        {/* Modal - centered on all screen sizes */}
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl pointer-events-auto max-h-[85vh] flex flex-col"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 flex-shrink-0">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                            <Clock size={18} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold text-white">Work Hours</h2>
                                            <p className="text-xs sm:text-sm text-gray-400">Set your focus time</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content - scrollable */}
                                <div className="p-3 sm:p-6 space-y-2 sm:space-y-3 overflow-y-auto flex-1">
                                    {workHours.map((wh, index) => {
                                        const day = DAYS_OF_WEEK[wh.day_of_week]
                                        const isShowingCopyModal = copyFromDay === index
                                        return (
                                            <div key={wh.day_of_week} className="relative">
                                                <div 
                                                    className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-colors ${
                                                        wh.is_enabled
                                                            ? 'bg-zinc-900/50 border-zinc-800'
                                                            : 'bg-zinc-950/50 border-zinc-800/50 opacity-60'
                                                    }`}
                                                >
                                                    <button
                                                        onClick={() => handleToggleDay(index)}
                                                        className={`w-5 h-5 rounded border transition-colors flex items-center justify-center flex-shrink-0 ${
                                                            wh.is_enabled
                                                                ? 'bg-blue-600 border-blue-600'
                                                                : 'bg-transparent border-zinc-700'
                                                        }`}
                                                    >
                                                        {wh.is_enabled && (
                                                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                                                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                        )}
                                                    </button>

                                                    <div className="w-12 sm:w-20 font-medium text-white text-sm sm:text-base flex-shrink-0">
                                                        {day.short}
                                                    </div>

                                                    <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                                        <input
                                                            type="time"
                                                            value={wh.start_time.substring(0, 5)}
                                                            onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                                                            disabled={!wh.is_enabled}
                                                            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                        />
                                                        <span className="text-gray-500 text-xs sm:text-sm">-</span>
                                                        <input
                                                            type="time"
                                                            value={wh.end_time.substring(0, 5)}
                                                            onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                                                            disabled={!wh.is_enabled}
                                                            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => setCopyFromDay(isShowingCopyModal ? null : index)}
                                                        className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                                                        title="Copy to other days"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                </div>

                                                {/* Copy Modal */}
                                                {isShowingCopyModal && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="absolute top-full left-0 right-0 mt-2 p-3 sm:p-4 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10"
                                                    >
                                                        <div className="mb-3">
                                                            <div className="flex items-center justify-between mb-2 gap-2">
                                                                <p className="text-xs sm:text-sm font-medium text-white">Copy to:</p>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            const weekdayIndices = [1, 2, 3, 4, 5].filter(idx => idx !== index)
                                                                            setSelectedDaysToCopy(weekdayIndices)
                                                                        }}
                                                                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                                                                    >
                                                                        Mon-Fri
                                                                    </button>
                                                                    {selectedDaysToCopy.length > 0 && (
                                                                        <button
                                                                            onClick={() => setSelectedDaysToCopy([])}
                                                                            className="text-xs text-gray-400 hover:text-gray-300 underline"
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                {workHours.map((targetWh, targetIndex) => {
                                                                    if (targetIndex === index) return null
                                                                    const targetDay = DAYS_OF_WEEK[targetWh.day_of_week]
                                                                    return (
                                                                        <label
                                                                            key={targetIndex}
                                                                            className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 hover:text-white cursor-pointer"
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedDaysToCopy.includes(targetIndex)}
                                                                                onChange={() => toggleDayToCopy(targetIndex)}
                                                                                className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-700 text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            {targetDay.short}
                                                                        </label>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    if (selectedDaysToCopy.length > 0) {
                                                                        handleCopyToDays(index, selectedDaysToCopy)
                                                                    }
                                                                }}
                                                                disabled={selectedDaysToCopy.length === 0}
                                                                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white text-xs sm:text-sm rounded-lg transition-colors"
                                                            >
                                                                Apply ({selectedDaysToCopy.length})
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setCopyFromDay(null)
                                                                    setSelectedDaysToCopy([])
                                                                }}
                                                                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-300 text-xs sm:text-sm rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-zinc-800 flex-shrink-0">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        disabled={isSaving}
                                        className="px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 text-sm"
                                    >
                                        <Save size={14} />
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}


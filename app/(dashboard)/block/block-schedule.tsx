'use client'

import { TimeBlock } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Clock,
    Briefcase,
    Coffee,
    User,
    MoreHorizontal,
    Plus,
    Pencil,
    Trash2,
    CheckCircle2,
    X,
    Play,
    Calendar,
    Users,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

interface BlockScheduleProps {
    blocks: TimeBlock[]
    selectedDate: string
}

export default function BlockSchedule({ blocks, selectedDate }: BlockScheduleProps) {
    const router = useRouter()
    const supabase = createClient()
    const [completingBlockId, setCompletingBlockId] = useState<string | null>(null)
    const [currentTime, setCurrentTime] = useState('')

    // Update current time every minute
    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            })
            setCurrentTime(timeString)
        }
        updateTime()
        const interval = setInterval(updateTime, 60000)
        return () => clearInterval(interval)
    }, [])

    // Manual Add/Edit State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)

    // Form State
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')
    const [blockType, setBlockType] = useState<TimeBlock['block_type']>('deep_work')
    const [taskTitle, setTaskTitle] = useState('')

    const handleMarkComplete = async (blockId: string) => {
        setCompletingBlockId(blockId)

        await supabase
            .from('time_blocks')
            .update({ completed: true })
            .eq('id', blockId)

        setTimeout(() => {
            router.refresh()
            setCompletingBlockId(null)
        }, 500)
    }

    const handleDelete = async (blockId: string) => {
        if (!confirm('Delete this time block?')) return

        await supabase
            .from('time_blocks')
            .delete()
            .eq('id', blockId)

        router.refresh()
    }

    const openAddModal = () => {
        setEditingBlock(null)
        setStartTime('09:00')
        setEndTime('10:00')
        setBlockType('deep_work')
        setTaskTitle('')
        setIsModalOpen(true)
    }

    const openEditModal = (block: TimeBlock) => {
        setEditingBlock(block)
        setStartTime(block.start_time.slice(0, 5))
        setEndTime(block.end_time.slice(0, 5))
        setBlockType(block.block_type)
        setTaskTitle(block.task_title || '')
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const blockData = {
            user_id: user.id,
            start_time: startTime,
            end_time: endTime,
            block_type: blockType,
            task_title: taskTitle,
            date: selectedDate,
        }

        if (editingBlock) {
            await supabase
                .from('time_blocks')
                .update(blockData)
                .eq('id', editingBlock.id)
        } else {
            await supabase
                .from('time_blocks')
                .insert({ ...blockData, completed: false })
        }

        setIsModalOpen(false)
        router.refresh()
    }

    // Date navigation functions
    const navigateDate = (days: number) => {
        const newDate = new Date(selectedDate + 'T12:00:00')
        newDate.setDate(newDate.getDate() + days)
        const dateString = newDate.toISOString().split('T')[0]
        router.push(`/block?date=${dateString}`)
    }

    const goToToday = () => {
        const today = new Date().toISOString().split('T')[0]
        router.push(`/block?date=${today}`)
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.push(`/block?date=${e.target.value}`)
    }

    // Helper to get icon based on block type
    const getBlockIcon = (type: string) => {
        switch (type) {
            case 'deep_work': return <Briefcase size={18} />
            case 'shallow_work': return <MoreHorizontal size={18} />
            case 'break': return <Coffee size={18} />
            case 'personal': return <User size={18} />
            case 'meeting': return <Users size={18} />
            default: return <Clock size={18} />
        }
    }

    // Helper to get color based on block type
    const getBlockColor = (type: string) => {
        switch (type) {
            case 'deep_work': return 'from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-200'
            case 'shallow_work': return 'from-zinc-800/40 to-zinc-900/40 border-zinc-700/30 text-gray-300'
            case 'break': return 'from-emerald-900/20 to-emerald-800/20 border-emerald-500/20 text-emerald-200'
            case 'personal': return 'from-purple-900/20 to-purple-800/20 border-purple-500/20 text-purple-200'
            case 'meeting': return 'from-amber-900/20 to-amber-800/20 border-amber-500/20 text-amber-200'
            default: return 'from-zinc-800 to-zinc-900 border-zinc-800 text-gray-400'
        }
    }

    // Check if selected date is today
    const isToday = selectedDate === new Date().toISOString().split('T')[0]

    // Derived State Logic - only show "current" if viewing today
    const currentBlock = isToday ? blocks.find(b =>
        !b.completed &&
        b.start_time <= currentTime &&
        b.end_time > currentTime
    ) : null

    const upcomingBlocks = blocks.filter(b =>
        !b.completed &&
        (isToday ? b.start_time > currentTime : true)
    ).sort((a, b) => a.start_time.localeCompare(b.start_time))

    const completedBlocks = blocks.filter(b =>
        b.completed || (isToday && b.end_time <= currentTime)
    ).sort((a, b) => b.end_time.localeCompare(a.end_time))

    return (
        <div className="space-y-8">
            {/* HEADER WITH DATE PICKER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-blue-500" /> Schedule
                    </h2>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Date Navigation */}
                    <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
                        <button
                            onClick={() => navigateDate(-1)}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            className="bg-transparent border-none text-white text-sm font-medium px-2 focus:outline-none cursor-pointer"
                        />
                        
                        <button
                            onClick={() => navigateDate(1)}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {!isToday && (
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                        >
                            Today
                        </button>
                    )}

                    <button
                        onClick={openAddModal}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg transition-colors border border-zinc-700"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* EMPTY STATE */}
            {blocks.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center backdrop-blur-sm"
                >
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No blocks scheduled</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Your schedule is clear. Plan your day manually or let AI assist you.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={openAddModal}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors border border-zinc-700 flex items-center gap-2"
                        >
                            <Plus size={18} /> Add Block
                        </button>
                        <Link
                            href="/chat"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                        >
                            <Briefcase size={18} /> Ask Claude to Plan
                        </Link>
                    </div>
                </motion.div>
            )}

            <div className="space-y-6">
                {/* CURRENT BLOCK - Only show if viewing today */}
                <AnimatePresence mode="wait">
                    {currentBlock && (
                        <motion.div
                            key="current"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative overflow-hidden rounded-2xl border border-blue-500/50 bg-gradient-to-br from-blue-900/20 to-black p-6 shadow-2xl shadow-blue-900/10"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Play size={120} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        NOW
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(currentBlock)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-200"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 mb-6">
                                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-300 border border-blue-500/20">
                                        {getBlockIcon(currentBlock.block_type)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">
                                            {currentBlock.task_title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-blue-200/70 font-medium">
                                            <Clock size={16} />
                                            {currentBlock.start_time.slice(0, 5)} - {currentBlock.end_time.slice(0, 5)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleMarkComplete(currentBlock.id)}
                                    disabled={completingBlockId === currentBlock.id}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group"
                                >
                                    {completingBlockId === currentBlock.id ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                                            Mark Complete
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* UPCOMING / SCHEDULED BLOCKS */}
                {upcomingBlocks.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">
                            {isToday ? 'Upcoming' : 'Scheduled'}
                        </h3>
                        <div className="space-y-3">
                            {upcomingBlocks.map((block, index) => (
                                <motion.div
                                    key={block.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`group flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r backdrop-blur-sm transition-all hover:translate-x-1 ${getBlockColor(block.block_type)}`}
                                >
                                    <div className="text-sm font-mono font-medium opacity-70 w-24 flex-shrink-0">
                                        {block.start_time.slice(0, 5)}
                                    </div>

                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                        <div className={`p-2 rounded-lg bg-black/20 border border-white/5`}>
                                            {getBlockIcon(block.block_type)}
                                        </div>
                                        <span className="font-medium truncate">
                                            {block.task_title}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(block)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(block.id)}
                                            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* COMPLETED BLOCKS */}
                {completedBlocks.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">
                            Completed
                        </h3>
                        <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                            {completedBlocks.map((block) => (
                                <div
                                    key={block.id}
                                    className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30"
                                >
                                    <div className="text-sm font-mono text-gray-500 w-24 flex-shrink-0 line-through">
                                        {block.start_time.slice(0, 5)}
                                    </div>

                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-lg bg-zinc-800 text-gray-500">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <span className="font-medium text-gray-500 line-through truncate">
                                            {block.task_title}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(block)}
                                            className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors text-gray-400"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(block.id)}
                                            className="p-1.5 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors text-gray-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ADD/EDIT MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingBlock ? 'Edit Block' : 'Add Time Block'}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">START</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">END</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">TYPE</label>
                                    <select
                                        value={blockType}
                                        onChange={(e) => setBlockType(e.target.value as any)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="deep_work">Deep Work</option>
                                        <option value="shallow_work">Shallow Work</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="personal">Personal</option>
                                        <option value="break">Break</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">TASK</label>
                                    <input
                                        type="text"
                                        placeholder="What are you working on?"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!taskTitle.trim()}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-900/20"
                                    >
                                        {editingBlock ? 'Save Changes' : 'Add Block'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}


'use client'

import { TimeBlock, Task, UserWorkHours, Project } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useRef } from 'react'
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
    ChevronRight,
    ListTodo,
    GripVertical
} from 'lucide-react'
import { useAI } from '@/contexts/ai-context'
import { getLocalDateString, addDays, format12Hour } from '@/lib/utils/date'

interface BlockScheduleProps {
    blocks: TimeBlock[]
    selectedDate: string
    activeTasks: Task[]
    workHours: UserWorkHours[]
    projects: Project[]
}

export default function BlockSchedule({ blocks, selectedDate, activeTasks, workHours, projects }: BlockScheduleProps) {
    const router = useRouter()
    const supabase = createClient()
    const { aiName } = useAI()
    const [completingBlockId, setCompletingBlockId] = useState<string | null>(null)
    const [currentTime, setCurrentTime] = useState('')
    const [draggedBlock, setDraggedBlock] = useState<TimeBlock | null>(null)
    const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
    const timelineRef = useRef<HTMLDivElement>(null)

    // Update current time every minute
    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            const hours = String(now.getHours()).padStart(2, '0')
            const minutes = String(now.getMinutes()).padStart(2, '0')
            setCurrentTime(`${hours}:${minutes}`)
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
    const [blockDate, setBlockDate] = useState(selectedDate)
    const [taskId, setTaskId] = useState<string>('')
    const [projectId, setProjectId] = useState<string>('')
    const [taskSource, setTaskSource] = useState<'none' | 'from_queue' | 'custom'>('none')

    // Calculate visible hours based on work hours for the selected date
    const getVisibleHours = () => {
        const date = new Date(selectedDate + 'T12:00:00')
        const dayOfWeek = date.getDay()
        
        // Find work hours for this day
        const dayWorkHours = workHours.find(wh => wh.day_of_week === dayOfWeek)
        
        if (!dayWorkHours || !dayWorkHours.is_enabled) {
            // No work hours set, default to 9-5
            return { start: 7, end: 19 } // 7am-7pm (9-5 work + 2hr buffer)
        }
        
        // Parse work hours
        const startHour = parseInt(dayWorkHours.start_time.split(':')[0])
        const endHour = parseInt(dayWorkHours.end_time.split(':')[0])
        
        // Add 2-hour buffer on each side
        return {
            start: Math.max(0, startHour - 2),
            end: Math.min(24, endHour + 2)
        }
    }

    // Generate 30-minute time slots
    const generateTimeSlots = () => {
        const { start, end } = getVisibleHours()
        const slots = []
        
        for (let hour = start; hour < end; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`)
            slots.push(`${hour.toString().padStart(2, '0')}:30`)
        }
        
        return slots
    }

    const timeSlots = generateTimeSlots()
    const visibleHours = getVisibleHours()

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

    const openAddModal = (presetStartTime?: string, presetEndTime?: string) => {
        setEditingBlock(null)
        setStartTime(presetStartTime || '09:00')
        setEndTime(presetEndTime || (presetStartTime ? addMinutesToTime(presetStartTime, 60) : '10:00'))
        setBlockType('deep_work')
        setTaskTitle('')
        setBlockDate(selectedDate)
        setTaskId('')
        setProjectId('')
        setTaskSource('none')
        setIsModalOpen(true)
    }

    // Helper to add minutes to time string
    const addMinutesToTime = (time: string, minutes: number): string => {
        const [hours, mins] = time.split(':').map(Number)
        const totalMinutes = hours * 60 + mins + minutes
        const newHours = Math.floor(totalMinutes / 60) % 24
        const newMins = totalMinutes % 60
        return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
    }

    // Click on timeline to create block
    const handleTimelineClick = (slot: string, e: React.MouseEvent) => {
        // Don't create if clicking on an existing block
        if ((e.target as HTMLElement).closest('.time-block-item')) return
        
        // Check if slot already has a block
        const hasBlock = blocks.some(block => {
            const blockStart = block.start_time.slice(0, 5)
            const blockEnd = block.end_time.slice(0, 5)
            return slot >= blockStart && slot < blockEnd
        })
        
        if (!hasBlock) {
            openAddModal(slot)
        }
    }

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, block: TimeBlock) => {
        setDraggedBlock(block)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', block.id)
    }

    const handleDragEnd = () => {
        setDraggedBlock(null)
        setDragOverSlot(null)
    }

    const handleDragOver = (e: React.DragEvent, slot: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverSlot(slot)
    }

    const handleDragLeave = () => {
        setDragOverSlot(null)
    }

    const handleDrop = async (e: React.DragEvent, slot: string) => {
        e.preventDefault()
        setDragOverSlot(null)
        
        if (!draggedBlock) return
        
        // Calculate new times
        const originalDuration = getBlockDurationMinutes(draggedBlock)
        const newStartTime = slot
        const newEndTime = addMinutesToTime(slot, originalDuration)
        
        // Check for overlaps with other blocks (excluding the dragged one)
        const hasOverlap = blocks.some(block => {
            if (block.id === draggedBlock.id) return false
            const blockStart = block.start_time.slice(0, 5)
            const blockEnd = block.end_time.slice(0, 5)
            return (
                (newStartTime >= blockStart && newStartTime < blockEnd) ||
                (newEndTime > blockStart && newEndTime <= blockEnd) ||
                (newStartTime <= blockStart && newEndTime >= blockEnd)
            )
        })
        
        if (hasOverlap) {
            alert('Cannot move block here - it would overlap with another block')
            return
        }
        
        // Update block in database
        await supabase
            .from('time_blocks')
            .update({
                start_time: newStartTime,
                end_time: newEndTime
            })
            .eq('id', draggedBlock.id)
        
        router.refresh()
    }

    const getBlockDurationMinutes = (block: TimeBlock): number => {
        const [startH, startM] = block.start_time.split(':').map(Number)
        const [endH, endM] = block.end_time.split(':').map(Number)
        return (endH * 60 + endM) - (startH * 60 + startM)
    }

    const openEditModal = (block: TimeBlock) => {
        setEditingBlock(block)
        setStartTime(block.start_time.slice(0, 5))
        setEndTime(block.end_time.slice(0, 5))
        setBlockType(block.block_type)
        setTaskTitle(block.task_title || '')
        setBlockDate(block.date)
        setTaskId(block.task_id || '')
        setProjectId(block.project_id || '')
        
        // Determine task source based on existing data
        if (block.task_id) {
            setTaskSource('from_queue')
        } else if (block.task_title) {
            setTaskSource('custom')
        } else {
            setTaskSource('none')
        }
        
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
            task_title: taskTitle || null,
            date: blockDate,
            task_id: taskId || null,
            project_id: projectId || null,
        }

        // Debug logging
        console.log('Creating/Updating Time Block:', {
            blockDate,
            selectedDate,
            blockData
        })

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
        const dateString = addDays(newDate, days)
        router.push(`/block?date=${dateString}`)
    }

    const goToToday = () => {
        const today = getLocalDateString()
        router.push(`/block?date=${today}`)
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.push(`/block?date=${e.target.value}`)
    }

    // Helper to get icon based on block type
    const getBlockIcon = (type: string, small = false) => {
        const iconSize = small ? 14 : 18
        switch (type) {
            case 'deep_work': return <Briefcase size={iconSize} />
            case 'shallow_work': return <MoreHorizontal size={iconSize} />
            case 'break': return <Coffee size={iconSize} />
            case 'personal': return <User size={iconSize} />
            case 'meeting': return <Users size={iconSize} />
            default: return <Clock size={iconSize} />
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

    // Check if selected date is today (in user's local timezone)
    const isToday = selectedDate === getLocalDateString()

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
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-blue-500" size={20} /> Schedule
                    </h2>
                    <button
                        onClick={() => openAddModal()}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg transition-colors border border-zinc-700"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    {/* Date Navigation */}
                    <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
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
                            className="bg-transparent border-none text-white text-sm font-medium px-1 sm:px-2 focus:outline-none cursor-pointer w-[130px] sm:w-auto"
                        />
                        
                        <button
                            onClick={() => navigateDate(1)}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    
                    {isToday && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-blue-500/30"
                        >
                            TODAY
                        </motion.div>
                    )}

                    {!isToday && (
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={goToToday}
                            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                        >
                            Today
                        </motion.button>
                    )}
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
                            onClick={() => openAddModal()}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors border border-zinc-700 flex items-center gap-2"
                        >
                            <Plus size={18} /> Add Block
                        </button>
                        <Link
                            href="/chat"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                        >
                            <Briefcase size={18} /> Ask {aiName} to Plan
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* VISUAL TIMETABLE */}
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="relative" ref={timelineRef}>
                    {/* Time Grid */}
                    {timeSlots.map((slot, index) => {
                        const hour = parseInt(slot.split(':')[0])
                        const isWorkHour = hour >= visibleHours.start + 2 && hour < visibleHours.end - 2
                        const isHourMark = slot.endsWith(':00')
                        const isDragOver = dragOverSlot === slot
                        
                        // Check if this slot is occupied by a block
                        const isOccupied = blocks.some(block => {
                            const blockStart = block.start_time.slice(0, 5)
                            const blockEnd = block.end_time.slice(0, 5)
                            return slot >= blockStart && slot < blockEnd
                        })
                        
                        return (
                            <div
                                key={slot}
                                onClick={(e) => handleTimelineClick(slot, e)}
                                onDragOver={(e) => handleDragOver(e, slot)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, slot)}
                                className={`flex border-b transition-all cursor-pointer group ${
                                    isHourMark ? 'border-zinc-700' : 'border-zinc-800/50'
                                } ${
                                    isWorkHour ? 'bg-blue-500/5' : 'bg-transparent'
                                } ${
                                    isDragOver ? 'bg-blue-500/20 border-blue-500/50' : ''
                                } ${
                                    !isOccupied ? 'hover:bg-zinc-800/30' : ''
                                }`}
                                style={{ height: '60px' }}
                            >
                                {/* Time Label */}
                                <div className={`w-24 flex-shrink-0 p-3 text-xs font-mono border-r border-zinc-800 ${
                                    isHourMark ? 'text-gray-400 font-semibold' : 'text-gray-600'
                                }`}>
                                    {isHourMark ? (
                                        <span>{format12Hour(slot)}</span>
                                    ) : (
                                        <span className="text-[10px]">{format12Hour(slot)}</span>
                                    )}
                                </div>
                                
                                {/* Time Slot Area */}
                                <div className="flex-1 relative">
                                    {isWorkHour && isHourMark && (
                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] font-semibold text-blue-400">
                                            WORK HOURS
                                        </div>
                                    )}
                                    {/* Click to add indicator */}
                                    {!isOccupied && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <Plus size={14} />
                                                <span>Click to add block</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    
                    {/* Overlaid Time Blocks */}
                    {blocks.map((block) => {
                        const startMinutes = parseInt(block.start_time.split(':')[0]) * 60 + parseInt(block.start_time.split(':')[1])
                        const endMinutes = parseInt(block.end_time.split(':')[0]) * 60 + parseInt(block.end_time.split(':')[1])
                        const startHourInView = visibleHours.start * 60
                        const topPosition = ((startMinutes - startHourInView) / 30) * 60
                        const height = ((endMinutes - startMinutes) / 30) * 60
                        const durationMinutes = endMinutes - startMinutes
                        
                        const isCurrent = currentBlock?.id === block.id
                        const isShortBlock = durationMinutes <= 60 // 1 hour or less
                        
                        // Get block type colors
                        const getBlockTypeStyle = (type: string, completed: boolean, current: boolean) => {
                            if (completed) {
                                return 'bg-zinc-900/50 border-zinc-700/50 opacity-60'
                            }
                            if (current) {
                                return 'bg-gradient-to-br from-blue-700/80 to-blue-800/80 border-blue-600/40 shadow-lg shadow-blue-900/20'
                            }
                            
                            switch (type) {
                                case 'deep_work':
                                    return 'bg-gradient-to-br from-purple-700/80 to-purple-800/80 border-purple-600/40 hover:border-purple-500/60'
                                case 'shallow_work':
                                    return 'bg-gradient-to-br from-blue-700/80 to-blue-800/80 border-blue-600/40 hover:border-blue-500/60'
                                case 'meeting':
                                    return 'bg-gradient-to-br from-orange-700/80 to-orange-800/80 border-orange-600/40 hover:border-orange-500/60'
                                case 'break':
                                    return 'bg-gradient-to-br from-green-700/80 to-green-800/80 border-green-600/40 hover:border-green-500/60'
                                case 'personal':
                                    return 'bg-gradient-to-br from-pink-700/80 to-pink-800/80 border-pink-600/40 hover:border-pink-500/60'
                                default:
                                    return 'bg-gradient-to-br from-zinc-700/90 to-zinc-800/90 border-zinc-600/50 hover:border-zinc-500'
                            }
                        }
                        
                        return (
                            <motion.div
                                key={block.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.01 }}
                                draggable={!block.completed}
                                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, block)}
                                onDragEnd={handleDragEnd}
                                className={`time-block-item absolute left-20 right-0 mx-2 rounded-xl border-2 backdrop-blur-sm cursor-pointer group transition-all overflow-hidden ${
                                    getBlockTypeStyle(block.block_type, block.completed, isCurrent)
                                } ${draggedBlock?.id === block.id ? 'opacity-50' : ''}`}
                                style={{
                                    top: `${topPosition}px`,
                                    height: `${height}px`,
                                    zIndex: isCurrent ? 20 : 10
                                }}
                                onClick={() => openEditModal(block)}
                            >
                                {/* Background Pattern */}
                                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                                
                                {isCurrent && (
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        NOW
                                    </div>
                                )}
                                
                                {block.completed && !isShortBlock && (
                                    <div className="absolute top-2 right-2 bg-zinc-800 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={10} />
                                        DONE
                                    </div>
                                )}
                                
                                {isShortBlock ? (
                                    // Compact layout for short blocks (1 hour or less)
                                    <div className="relative h-full px-3 py-2 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {!block.completed && (
                                                <div className="opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing flex-shrink-0 text-white/50">
                                                    <GripVertical size={14} />
                                                </div>
                                            )}
                                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                                {getBlockIcon(block.block_type, true)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-semibold text-xs leading-tight truncate ${
                                                    block.completed 
                                                        ? 'line-through text-gray-400' 
                                                        : 'text-white'
                                                }`}>
                                                    {block.task_title}
                                                </div>
                                                <div className="text-[10px] text-white/60 font-mono">
                                                    {format12Hour(block.start_time)} - {format12Hour(block.end_time)}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Compact Action Buttons */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
                                            {!block.completed && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleMarkComplete(block.id)
                                                    }}
                                                    className="w-5 h-5 rounded-full bg-green-500/40 hover:bg-green-500/60 flex items-center justify-center transition-all"
                                                    title="Mark Complete"
                                                >
                                                    <CheckCircle2 size={10} className="text-green-200" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openEditModal(block)
                                                }}
                                                className="w-5 h-5 rounded-full bg-blue-500/40 hover:bg-blue-500/60 flex items-center justify-center transition-all"
                                                title="Edit"
                                            >
                                                <Pencil size={10} className="text-blue-200" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(block.id)
                                                }}
                                                className="w-5 h-5 rounded-full bg-red-500/40 hover:bg-red-500/60 flex items-center justify-center transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={10} className="text-red-200" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // Regular layout for longer blocks
                                    <div className="relative h-full p-4 flex flex-col justify-between">
                                        {/* Header */}
                                        <div className="flex items-start gap-3">
                                            {!block.completed && (
                                                <div className="opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing flex-shrink-0 text-white/50 pt-2">
                                                    <GripVertical size={16} />
                                                </div>
                                            )}
                                            <div className={`p-2 rounded-lg ${
                                                isCurrent 
                                                    ? 'bg-white/20' 
                                                    : 'bg-black/20'
                                            } flex-shrink-0`}>
                                                {getBlockIcon(block.block_type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold text-base leading-tight mb-1 ${
                                                    block.completed 
                                                        ? 'line-through text-gray-400' 
                                                        : 'text-white'
                                                }`}>
                                                    {block.task_title}
                                                </div>
                                                {block.task_id && (
                                                    <div className="flex items-center gap-1.5 text-xs text-white/70 bg-black/20 rounded-md px-2 py-1 w-fit backdrop-blur-sm">
                                                        <ListTodo size={12} />
                                                        <span className="truncate max-w-[200px]">
                                                            {activeTasks.find(t => t.id === block.task_id)?.title}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Footer */}
                                        <div className="flex items-end justify-between gap-2">
                                            <div className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md ${
                                                isCurrent 
                                                    ? 'bg-white/20 text-white backdrop-blur-sm' 
                                                    : 'bg-black/20 text-white/80 backdrop-blur-sm'
                                            }`}>
                                                {format12Hour(block.start_time)} - {format12Hour(block.end_time)}
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                                                {!block.completed && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleMarkComplete(block.id)
                                                        }}
                                                        className="p-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm rounded-lg text-green-300 hover:text-green-200 transition-all border border-green-500/30"
                                                        title="Mark Complete"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openEditModal(block)
                                                    }}
                                                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm rounded-lg text-blue-300 hover:text-blue-200 transition-all border border-blue-500/30"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(block.id)
                                                    }}
                                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-lg text-red-300 hover:text-red-200 transition-all border border-red-500/30"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                    
                    {/* Current Time Indicator - Only show if viewing today */}
                    {isToday && currentTime && (
                        <div
                            className="absolute left-0 right-0 pointer-events-none z-30"
                            style={{
                                top: `${((parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1])) - (visibleHours.start * 60)) / 30 * 60}px`
                            }}
                        >
                            <div className="flex items-center">
                                <div className="w-20 flex items-center justify-end pr-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
                                </div>
                                <div className="flex-1 h-0.5 bg-red-500 shadow-lg shadow-red-500/50" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6 hidden">
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
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-white mb-1">
                                            {currentBlock.task_title}
                                        </h3>
                                        {currentBlock.task_id && (
                                            <div className="flex items-center gap-1.5 mb-2 text-blue-300/70 text-sm">
                                                <ListTodo size={14} />
                                                <span>{activeTasks.find(t => t.id === currentBlock.task_id)?.title || 'Linked Task'}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-blue-200/70 font-medium">
                                            <Clock size={16} />
                                            {format12Hour(currentBlock.start_time)} - {format12Hour(currentBlock.end_time)}
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
                                    <div className="text-sm font-mono font-medium opacity-70 w-32 flex-shrink-0">
                                        {format12Hour(block.start_time)}
                                    </div>

                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                        <div className={`p-2 rounded-lg bg-black/20 border border-white/5`}>
                                            {getBlockIcon(block.block_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium truncate block">
                                                {block.task_title}
                                            </span>
                                            {block.task_id && (
                                                <span className="text-xs text-blue-400/70 flex items-center gap-1 mt-0.5">
                                                    <ListTodo size={12} />
                                                    {activeTasks.find(t => t.id === block.task_id)?.title || 'Linked Task'}
                                                </span>
                                            )}
                                        </div>
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
                                    <div className="text-sm font-mono text-gray-500 w-32 flex-shrink-0 line-through">
                                        {format12Hour(block.start_time)}
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
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">DATE</label>
                                    <input
                                        type="date"
                                        value={blockDate}
                                        onChange={(e) => setBlockDate(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>

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
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">PROJECT (OPTIONAL)</label>
                                    <select
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="">No project</option>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.project_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">TASK</label>
                                    <select
                                        value={taskSource}
                                        onChange={(e) => {
                                            const value = e.target.value as 'none' | 'from_queue' | 'custom'
                                            setTaskSource(value)
                                            if (value === 'none') {
                                                setTaskTitle('')
                                                setTaskId('')
                                            }
                                        }}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="none">No task</option>
                                        <option value="from_queue">Select from active queue</option>
                                        <option value="custom">Enter custom task</option>
                                    </select>
                                </div>

                                {taskSource === 'from_queue' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">SELECT TASK</label>
                                        <select
                                            value={taskId}
                                            onChange={(e) => {
                                                setTaskId(e.target.value)
                                                const selectedTask = activeTasks.find(t => t.id === e.target.value)
                                                if (selectedTask) {
                                                    setTaskTitle(selectedTask.title)
                                                }
                                            }}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                        >
                                            <option value="">Choose a task...</option>
                                            {activeTasks.map((task) => (
                                                <option key={task.id} value={task.id}>
                                                    {task.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {taskSource === 'custom' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">TASK DESCRIPTION</label>
                                        <input
                                            type="text"
                                            placeholder="What are you working on?"
                                            value={taskTitle}
                                            onChange={(e) => {
                                                setTaskTitle(e.target.value)
                                                setTaskId('') // Clear task ID for custom tasks
                                            }}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={taskSource !== 'none' && !taskTitle.trim()}
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


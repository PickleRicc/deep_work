'use client'

import { Task } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import Link from 'next/link'
import {
    Plus,
    MoreHorizontal,
    CheckCircle2,
    Circle,
    ArrowRight,
    Trash2,
    Pencil,
    X,
    Calendar,
    AlignLeft
} from 'lucide-react'

interface QueueManagerProps {
    activeTasks: Task[]
    queuedTasks: Task[]
    completedTasks: Task[]
}

export default function QueueManager({ activeTasks, queuedTasks, completedTasks }: QueueManagerProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isPulling, setIsPulling] = useState(false)
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
    const [isAddingTask, setIsAddingTask] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskNotes, setNewTaskNotes] = useState('')

    // Edit State
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editNotes, setEditNotes] = useState('')

    const handleCompleteTask = async (taskId: string) => {
        setCompletingTaskId(taskId)

        await supabase
            .from('tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', taskId)

        // Wait for animation to complete before refreshing
        setTimeout(() => {
            router.refresh()
            setCompletingTaskId(null)
        }, 300)
    }

    const handlePullTask = async (taskId: string) => {
        if (activeTasks.length >= 3) {
            alert('You already have 3 active tasks. Complete one before pulling another.')
            return
        }

        setIsPulling(true)

        await supabase
            .from('tasks')
            .update({ status: 'active' })
            .eq('id', taskId)

        router.refresh()
        setIsPulling(false)
    }

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get the highest queue position
        const maxPosition = queuedTasks.length > 0
            ? Math.max(...queuedTasks.map(t => t.queue_position || 0))
            : 0

        await supabase
            .from('tasks')
            .insert({
                user_id: user.id,
                title: newTaskTitle,
                notes: newTaskNotes || null,
                status: 'backlog',
                queue_position: maxPosition + 1
            })

        setNewTaskTitle('')
        setNewTaskNotes('')
        setIsAddingTask(false)
        router.refresh()
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return

        await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        router.refresh()
    }

    const startEditing = (task: Task) => {
        setEditingTask(task)
        setEditTitle(task.title)
        setEditNotes(task.notes || '')
    }

    const handleUpdateTask = async () => {
        if (!editingTask || !editTitle.trim()) return

        await supabase
            .from('tasks')
            .update({
                title: editTitle,
                notes: editNotes || null
            })
            .eq('id', editingTask.id)

        setEditingTask(null)
        router.refresh()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        })
    }

    const availableSlots = 3 - activeTasks.length

    return (
        <div className="h-full w-full px-4 md:px-8 lg:px-12 pb-6 overflow-y-auto">
            <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 md:h-full">
            {/* BACKLOG COLUMN */}
            <div className="w-full flex flex-col bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-2xl min-h-[400px] md:h-full">
                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        <h2 className="font-semibold text-gray-200">Backlog</h2>
                        <span className="text-xs bg-zinc-800 text-gray-400 px-2 py-0.5 rounded-full">
                            {queuedTasks.length}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsAddingTask(!isAddingTask)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    <AnimatePresence mode="popLayout">
                        {isAddingTask && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-zinc-800/50 border border-blue-500/30 rounded-xl p-3 space-y-3 mb-3"
                            >
                                <input
                                    type="text"
                                    placeholder="Task title..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    autoFocus
                                />
                                <textarea
                                    placeholder="Add notes or details..."
                                    value={newTaskNotes}
                                    onChange={(e) => setNewTaskNotes(e.target.value)}
                                    rows={3}
                                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddTask}
                                        disabled={!newTaskTitle.trim()}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white py-1.5 rounded-lg text-xs font-medium transition-colors"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setIsAddingTask(false)}
                                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded-lg text-xs transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {queuedTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layoutId={task.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group bg-zinc-800/40 hover:bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="text-sm font-medium text-gray-200 leading-snug">
                                        {task.title}
                                    </h3>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEditing(task)}
                                            className="text-gray-500 hover:text-gray-300 p-1"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="text-gray-500 hover:text-red-400 p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {task.notes && (
                                    <div className="mt-3 pt-3 border-t border-zinc-700/50">
                                        <div className="flex items-start gap-2">
                                            <AlignLeft size={13} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                                                {task.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-3 flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                        <Calendar size={10} />
                                        {formatDate(task.created_at)}
                                    </div>
                                    <button
                                        onClick={() => handlePullTask(task.id)}
                                        disabled={activeTasks.length >= 3}
                                        className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Move to Active <ArrowRight size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* ACTIVE COLUMN */}
            <div className="w-full flex flex-col bg-blue-900/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl min-h-[350px] md:h-full">
                <div className="p-4 border-b border-blue-500/20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <h2 className="font-semibold text-blue-100">Active</h2>
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                            {activeTasks.length}/3
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent">
                    <AnimatePresence mode="popLayout">
                        {activeTasks.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-blue-500/20 rounded-xl">
                                <p className="text-sm text-blue-300/50">
                                    No active tasks
                                </p>
                                <p className="text-xs text-blue-300/30 mt-1">
                                    Pull from backlog to start
                                </p>
                            </div>
                        ) : (
                            activeTasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    layoutId={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="group bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/30 hover:border-blue-500/50 rounded-xl p-4 shadow-lg shadow-blue-900/20 transition-all"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <h3 className="text-base font-medium text-white leading-snug">
                                                {task.title}
                                            </h3>
                                            {task.notes && (
                                                <div className="mt-3 pt-3 border-t border-blue-500/20">
                                                    <div className="flex items-start gap-2">
                                                        <AlignLeft size={14} className="text-blue-400/50 mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-blue-200/80 leading-relaxed">
                                                            {task.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            disabled={completingTaskId === task.id}
                                            className="flex-shrink-0 text-blue-400 hover:text-green-400 transition-colors"
                                        >
                                            {completingTaskId === task.id ? (
                                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Circle size={20} />
                                            )}
                                        </button>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center pt-3 border-t border-blue-500/20">
                                        <div className="flex items-center gap-1.5 text-xs text-blue-300/50">
                                            <Calendar size={12} />
                                            Started {formatDate(task.created_at)}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(task)}
                                                className="text-blue-400/50 hover:text-blue-300 p-1"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* DONE COLUMN */}
            <div className="w-full flex flex-col bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-2xl min-h-[300px] md:h-full opacity-75 hover:opacity-100 transition-opacity">
                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <h2 className="font-semibold text-gray-200">Done</h2>
                        <span className="text-xs bg-zinc-800 text-gray-400 px-2 py-0.5 rounded-full">
                            Recent
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {completedTasks.map((task) => (
                        <motion.div
                            key={task.id}
                            layoutId={task.id}
                            className="bg-zinc-800/20 border border-zinc-800 rounded-xl p-3 opacity-60 hover:opacity-100 transition-all"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-green-500">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 line-through decoration-gray-600">
                                        {task.title}
                                    </h3>
                                    <p className="text-[10px] text-gray-600 mt-1">
                                        Completed {formatDate(task.completed_at || new Date().toISOString())}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            </div>

            {/* EDIT MODAL */}
            <AnimatePresence>
                {editingTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Edit Task</h3>
                                <button
                                    onClick={() => setEditingTask(null)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">TITLE</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">NOTES</label>
                                    <textarea
                                        value={editNotes}
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        placeholder="Add notes or details about this task..."
                                        rows={5}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setEditingTask(null)}
                                        className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateTask}
                                        disabled={!editTitle.trim()}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-900/20"
                                    >
                                        Save Changes
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

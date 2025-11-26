'use client'

import { motion, AnimatePresence } from 'motion/react'
import { ListTodo, ArrowRight, X, Pencil, ChevronLeft, Folder } from 'lucide-react'
import { Task, Project } from '@/lib/types/database'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TaskQueueCardProps {
    activeTasks: Task[]
    queuedTasks: Task[]
}

export default function TaskQueueCard({ activeTasks, queuedTasks }: TaskQueueCardProps) {
    const router = useRouter()
    const supabase = createClient()
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editNotes, setEditNotes] = useState('')
    const [editProjectId, setEditProjectId] = useState('')
    const [projects, setProjects] = useState<Project[]>([])

    // Fetch projects for the dropdown
    useEffect(() => {
        const fetchProjects = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('project_name')

            if (data) setProjects(data)
        }
        fetchProjects()
    }, [supabase])

    const handleMoveToBacklog = async (taskId: string) => {
        await supabase
            .from('tasks')
            .update({ 
                status: 'backlog',
                queue_position: null
            })
            .eq('id', taskId)

        router.refresh()
    }

    const startEditing = (task: Task) => {
        setEditingTask(task)
        setEditTitle(task.title)
        setEditNotes(task.notes || '')
        setEditProjectId(task.project_id || '')
    }

    const handleUpdateTask = async () => {
        if (!editingTask || !editTitle.trim()) return

        await supabase
            .from('tasks')
            .update({
                title: editTitle,
                notes: editNotes || null,
                project_id: editProjectId || null
            })
            .eq('id', editingTask.id)

        setEditingTask(null)
        router.refresh()
    }

    const getProjectName = (projectId: string | null) => {
        if (!projectId) return null
        return projects.find(p => p.id === projectId)?.project_name
    }
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ListTodo size={20} className="text-blue-400" />
                    <h3 className="font-semibold text-white">Task Queue</h3>
                </div>
                <Link href="/work?tab=queue" className="text-sm text-blue-400 hover:text-blue-300">
                    View all
                </Link>
            </div>

            {/* Active Tasks */}
            <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Active ({activeTasks.length}/3)
                </div>
                {activeTasks.length > 0 ? (
                    <div className="space-y-2">
                        {activeTasks.map((task) => (
                            <div
                                key={task.id}
                                className="group p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all cursor-pointer"
                                onClick={() => startEditing(task)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium line-clamp-1">
                                            {task.title}
                                        </p>
                                        {task.notes && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                                {task.notes}
                                            </p>
                                        )}
                                        {getProjectName(task.project_id) && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <Folder size={10} className="text-blue-400/50" />
                                                <span className="text-xs text-blue-400/70">{getProjectName(task.project_id)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleMoveToBacklog(task.id)
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400 hover:text-yellow-300 p-1"
                                        title="Move to Backlog"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No active tasks</p>
                )}
            </div>

            {/* Queued Tasks */}
            <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Queued ({queuedTasks.length})
                </div>
                {queuedTasks.length > 0 ? (
                    <div className="space-y-1">
                        {queuedTasks.slice(0, 3).map((task) => (
                            <div
                                key={task.id}
                                onClick={() => startEditing(task)}
                                className="p-2 bg-zinc-800/50 rounded text-sm text-gray-300 line-clamp-1 hover:bg-zinc-800 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex-1 truncate">{task.title}</span>
                                    <Pencil size={12} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </div>
                            </div>
                        ))}
                        {queuedTasks.length > 3 && (
                            <p className="text-xs text-gray-500 pl-2 pt-1">
                                +{queuedTasks.length - 3} more
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No queued tasks</p>
                )}
            </div>

            {activeTasks.length < 3 && queuedTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                    <Link
                        href="/work?tab=queue"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                        Pull task from queue
                        <ArrowRight size={14} />
                    </Link>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editingTask && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setEditingTask(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
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
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">PROJECT</label>
                                    <div className="flex items-center gap-2">
                                        <Folder size={16} className="text-gray-500" />
                                        <select
                                            value={editProjectId}
                                            onChange={(e) => setEditProjectId(e.target.value)}
                                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">No Project</option>
                                            {projects.map(project => (
                                                <option key={project.id} value={project.id}>{project.project_name}</option>
                                            ))}
                                        </select>
                                    </div>
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
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}


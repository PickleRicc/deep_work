'use client'

import { motion } from 'motion/react'
import { ListTodo, ArrowRight } from 'lucide-react'
import { Task } from '@/lib/types/database'
import Link from 'next/link'

interface TaskQueueCardProps {
    activeTasks: Task[]
    queuedTasks: Task[]
}

export default function TaskQueueCard({ activeTasks, queuedTasks }: TaskQueueCardProps) {
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
                                className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                            >
                                <p className="text-sm text-white font-medium line-clamp-1">
                                    {task.title}
                                </p>
                                {task.notes && (
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                        {task.notes}
                                    </p>
                                )}
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
                                className="p-2 bg-zinc-800/50 rounded text-sm text-gray-300 line-clamp-1"
                            >
                                {task.title}
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
        </motion.div>
    )
}


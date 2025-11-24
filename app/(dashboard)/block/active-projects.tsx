'use client'

import { Task } from '@/lib/types/database'
import { motion } from 'motion/react'
import { AlignLeft } from 'lucide-react'

interface ActiveProjectsProps {
    tasks: Task[]
}

export default function ActiveProjects({ tasks }: ActiveProjectsProps) {
    if (tasks.length === 0) {
        return null
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
                Active Projects ({tasks.length}/3)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tasks.map((task, index) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.1,
                        }}
                        className="bg-gradient-to-br from-blue-900/20 to-blue-900/10 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm"
                    >
                        <h3 className="font-medium text-white">{task.title}</h3>
                        {task.notes && (
                            <div className="mt-2 pt-2 border-t border-blue-500/20">
                                <div className="flex items-start gap-2">
                                    <AlignLeft size={12} className="text-blue-400/50 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-blue-200/70 leading-relaxed line-clamp-2">
                                        {task.notes}
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}


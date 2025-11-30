'use client'

import { useState } from 'react'
import { Task, Project } from '@/lib/types/database'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Folder, Tag } from 'lucide-react'
import ReviewModal from '@/components/review-modal'
import { useRouter } from 'next/navigation'

interface ReviewsClientProps {
    unreviewedTasks: Task[]
    unreviewedProjects: Project[]
}

export default function ReviewsClient({ unreviewedTasks, unreviewedProjects }: ReviewsClientProps) {
    const router = useRouter()
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    const groupByDate = <T extends Task | Project>(items: T[], dateKey: 'completed_at' | 'updated_at'): Record<string, T[]> => {
        const groups: Record<string, T[]> = {}
        
        items.forEach(item => {
            const dateStr = (item as any)[dateKey]
            if (!dateStr) return
            
            const date = new Date(dateStr)
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            
            let groupKey: string
            if (date.toDateString() === today.toDateString()) {
                groupKey = 'Today'
            } else if (date.toDateString() === yesterday.toDateString()) {
                groupKey = 'Yesterday'
            } else {
                groupKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = []
            }
            groups[groupKey].push(item)
        })
        
        return groups
    }

    const taskGroups = groupByDate(unreviewedTasks, 'completed_at')
    const projectGroups = groupByDate(unreviewedProjects, 'updated_at')

    const handleReviewComplete = () => {
        setSelectedTask(null)
        setSelectedProject(null)
        router.refresh()
    }

    if (unreviewedTasks.length === 0 && unreviewedProjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
                <p className="text-gray-400">
                    You've reviewed all your completed tasks and projects.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Tasks Section */}
            {unreviewedTasks.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Tasks ({unreviewedTasks.length})
                    </h2>
                    
                    <div className="space-y-6">
                        {Object.entries(taskGroups).map(([groupName, tasks]) => (
                            <div key={groupName}>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                    {groupName}
                                </h3>
                                <div className="grid gap-3">
                                    {tasks.map((task) => (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 cursor-pointer" onClick={() => setSelectedTask(task)}>
                                                    <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {formatDate(task.completed_at || '')}
                                                        </div>
                                                        {task.tags && task.tags.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Tag size={12} />
                                                                {task.tags.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedTask(task)}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Projects Section */}
            {unreviewedProjects.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        Projects ({unreviewedProjects.length})
                    </h2>
                    
                    <div className="space-y-6">
                        {Object.entries(projectGroups).map(([groupName, projects]) => (
                            <div key={groupName}>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                    {groupName}
                                </h3>
                                <div className="grid gap-3">
                                    {projects.map((project) => (
                                        <motion.div
                                            key={project.id}
                                            layout
                                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-purple-500/50 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 cursor-pointer" onClick={() => setSelectedProject(project)}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Folder size={16} className="text-purple-400" />
                                                        <h4 className="text-white font-medium group-hover:text-purple-400 transition-colors">
                                                            {project.project_name}
                                                        </h4>
                                                    </div>
                                                    {project.description && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {project.description}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            Completed {formatDate(project.updated_at)}
                                                        </div>
                                                        {project.tags && project.tags.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Tag size={12} />
                                                                {project.tags.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedProject(project)}
                                                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Review Modals */}
            <AnimatePresence>
                {selectedTask && (
                    <ReviewModal
                        item={selectedTask}
                        itemType="task"
                        onClose={() => setSelectedTask(null)}
                        onSubmit={handleReviewComplete}
                    />
                )}
                {selectedProject && (
                    <ReviewModal
                        item={selectedProject}
                        itemType="project"
                        onClose={() => setSelectedProject(null)}
                        onSubmit={handleReviewComplete}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}


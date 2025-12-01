'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Edit, Trash2, Folder, Calendar, Target, AlertCircle, CheckCircle2, Clock, Pause } from 'lucide-react'
import { Project, QuarterlyPlan, WeeklyPlan } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useReviewPrompt } from '@/hooks/use-review-prompt'
import ReviewModal from '@/components/review-modal'
import TagSelector from '@/components/tag-selector'

interface ProjectManagerProps {
    projects: Project[]
    quarterlyPlans: QuarterlyPlan[]
    weeklyPlans: WeeklyPlan[]
}

export default function ProjectManager({ projects: initialProjects, quarterlyPlans, weeklyPlans }: ProjectManagerProps) {
    const router = useRouter()
    const supabase = createClient()
    const { addPendingReview, showReviewModal, currentReview, skipReview, completeReview } = useReviewPrompt()
    
    const [projects, setProjects] = useState(initialProjects)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'on_hold' | 'completed'>('all')
    
    // Form state
    const [projectName, setProjectName] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<'active' | 'on_hold' | 'completed' | 'archived'>('active')
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
    const [startDate, setStartDate] = useState('')
    const [targetDate, setTargetDate] = useState('')
    const [quarterlyPlanId, setQuarterlyPlanId] = useState('')
    const [weeklyPlanId, setWeeklyPlanId] = useState('')
    const [progressPercentage, setProgressPercentage] = useState(0)
    const [notes, setNotes] = useState('')
    const [tags, setTags] = useState<string[]>([])

    const openAddModal = () => {
        resetForm()
        setIsAddModalOpen(true)
    }

    const openEditModal = (project: Project) => {
        setEditingProject(project)
        setProjectName(project.project_name)
        setDescription(project.description || '')
        setStatus(project.status)
        setPriority(project.priority)
        setStartDate(project.start_date || '')
        setTargetDate(project.target_completion_date || '')
        setQuarterlyPlanId(project.quarterly_plan_id || '')
        setTags(project.tags || [])
        setWeeklyPlanId(project.weekly_plan_id || '')
        setProgressPercentage(project.progress_percentage)
        setNotes(project.notes || '')
        setIsAddModalOpen(true)
    }

    const resetForm = () => {
        setEditingProject(null)
        setProjectName('')
        setDescription('')
        setStatus('active')
        setPriority('medium')
        setStartDate('')
        setTargetDate('')
        setQuarterlyPlanId('')
        setWeeklyPlanId('')
        setProgressPercentage(0)
        setNotes('')
        setTags([])
    }

    const handleSave = async () => {
        if (!projectName.trim()) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const projectData = {
            user_id: user.id,
            project_name: projectName.trim(),
            description: description.trim() || null,
            status,
            priority,
            start_date: startDate || null,
            target_completion_date: targetDate || null,
            quarterly_plan_id: quarterlyPlanId || null,
            weekly_plan_id: weeklyPlanId || null,
            progress_percentage: progressPercentage,
            notes: notes.trim() || null,
            tags: tags.length > 0 ? tags : null,
        }

        // Check if project was just completed
        const wasJustCompleted = editingProject && 
                                 editingProject.status !== 'completed' && 
                                 status === 'completed'

        if (editingProject) {
            // Update existing project
            const { error } = await supabase
                .from('projects')
                .update(projectData)
                .eq('id', editingProject.id)

            if (!error) {
                const updatedProject = { ...editingProject, ...projectData }
                setProjects(projects.map(p => p.id === editingProject.id ? updatedProject : p))
                
                // Trigger review prompt if project was just completed
                if (wasJustCompleted) {
                    setTimeout(() => {
                        addPendingReview(updatedProject, 'project')
                    }, 500)
                }
            }
        } else {
            // Create new project
            const { data, error } = await supabase
                .from('projects')
                .insert([projectData])
                .select()
                .single()

            if (!error && data) {
                setProjects([...projects, data])
            }
        }

        setIsAddModalOpen(false)
        resetForm()
        router.refresh()
    }

    const handleDelete = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project? Tasks linked to this project will not be deleted.')) return

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)

        if (!error) {
            setProjects(projects.filter(p => p.id !== projectId))
            router.refresh()
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <Target className="text-blue-400" size={18} />
            case 'on_hold': return <Pause className="text-yellow-400" size={18} />
            case 'completed': return <CheckCircle2 className="text-green-400" size={18} />
            case 'archived': return <Clock className="text-gray-400" size={18} />
            default: return <Folder size={18} />
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-400 bg-red-500/10 border-red-500/30'
            case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
            case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
            case 'low': return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
            default: return 'text-gray-400'
        }
    }

    const filteredProjects = projects.filter(p => {
        if (filterStatus === 'all') return true
        return p.status === filterStatus
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Projects</h2>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">Large-scale initiatives (1+ week duration)</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm sm:text-base font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> New Project
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {(['all', 'active', 'on_hold', 'completed'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilterStatus(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filterStatus === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                        }`}
                    >
                        {f.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                ))}
            </div>

            {/* Projects List */}
            {filteredProjects.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center">
                    <Folder className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No projects yet</h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-4">Create your first project to organize your work</p>
                    <button
                        onClick={openAddModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-medium transition-colors"
                    >
                        <Plus size={16} className="inline mr-2 sm:w-[18px] sm:h-[18px]" /> New Project
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredProjects.map(project => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-6 hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3 sm:gap-4">
                                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                        {getStatusIcon(project.status)}
                                        <h3 className="text-base sm:text-lg font-semibold text-white truncate">{project.project_name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(project.priority)}`}>
                                            {project.priority.toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    {project.description && (
                                        <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">{project.description}</p>
                                    )}

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                        {project.start_date && (
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                <span>Started {new Date(project.start_date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {project.target_completion_date && (
                                            <div className="flex items-center gap-1">
                                                <Target size={14} />
                                                <span>Due {new Date(project.target_completion_date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Progress</span>
                                            <span className="text-blue-400 font-medium">{project.progress_percentage}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${project.progress_percentage}%` }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => openEditModal(project)}
                                        className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                                    >
                                        <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                    >
                                        <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setIsAddModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-24 sm:pb-6"
                            style={{
                                maxHeight: 'calc(100vh - max(env(safe-area-inset-top), 16px) - max(env(safe-area-inset-bottom), 80px))'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-xl sm:text-2xl font-bold text-white">
                                    {editingProject ? 'Edit Project' : 'New Project'}
                                </h3>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Project Name *</label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500"
                                        placeholder="e.g., Launch New Website"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500 min-h-[80px] sm:min-h-[100px]"
                                        placeholder="What is this project about?"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as any)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="on_hold">On Hold</option>
                                            <option value="completed">Completed</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Priority</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as any)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Target Date</label>
                                        <input
                                            type="date"
                                            value={targetDate}
                                            onChange={(e) => setTargetDate(e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Progress</label>
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={progressPercentage}
                                            onChange={(e) => setProgressPercentage(parseInt(e.target.value))}
                                            className="flex-1"
                                        />
                                        <span className="text-blue-400 font-medium w-10 sm:w-12 text-right text-sm sm:text-base">{progressPercentage}%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Link to Quarterly Goal</label>
                                    <select
                                        value={quarterlyPlanId}
                                        onChange={(e) => setQuarterlyPlanId(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">None</option>
                                        {quarterlyPlans.map(plan => (
                                            <option key={plan.id} value={plan.id}>{plan.quarter}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Link to Weekly Goal</label>
                                    <select
                                        value={weeklyPlanId}
                                        onChange={(e) => setWeeklyPlanId(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">None</option>
                                        {weeklyPlans.map(plan => (
                                            <option key={plan.id} value={plan.id}>
                                                Week of {new Date(plan.week_start).toLocaleDateString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500 min-h-[60px] sm:min-h-[80px]"
                                        placeholder="Additional notes or context..."
                                    />
                                </div>

                                <TagSelector
                                    selectedTags={tags}
                                    onChange={setTags}
                                    label="Tags (Optional)"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!projectName.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingProject ? 'Save Changes' : 'Create Project'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* REVIEW MODAL */}
            {showReviewModal && currentReview && (
                <ReviewModal
                    item={currentReview.item}
                    itemType={currentReview.itemType}
                    onClose={skipReview}
                    onSubmit={() => completeReview(currentReview.item)}
                />
            )}
        </div>
    )
}


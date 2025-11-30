'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, ListTodo, Calendar, Folder } from 'lucide-react'
import { TimeBlock, Task, UserWorkHours, QuarterlyPlan, WeeklyPlan, Project } from '@/lib/types/database'
import BlockSchedule from '../block/block-schedule'
import ActiveProjects from '../block/active-projects'
import WorkHoursConfig from '../block/work-hours-config'
import PomodoroTimer from '@/components/pomodoro-timer'
import NotificationManager from '@/components/notification-manager'
import QueueManager from '../queue/queue-manager'
import { PlanTabs } from '../plan/plan-tabs'
import ProjectManager from './project-manager'
import PageQuotes from '@/components/page-quotes'

interface WorkTabsProps {
    // Block data
    timeBlocks: TimeBlock[]
    activeTasksForBlock: Task[]
    workHours: UserWorkHours[]
    selectedDate: string
    userId: string
    // Queue data
    activeTasks: Task[]
    queuedTasks: Task[]
    completedTasks: Task[]
    // Plan data
    quarterlyPlan: QuarterlyPlan | null
    weeklyPlan: WeeklyPlan | null
    currentQuarter: string
    weekStart: string
    // Project data
    projects: Project[]
    allQuarterlyPlans: QuarterlyPlan[]
    allWeeklyPlans: WeeklyPlan[]
    // Initial tab
    initialTab: string
    // Quotes
    quotes: string[]
}

type TabType = 'block' | 'queue' | 'projects' | 'plan'

export default function WorkTabs(props: WorkTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>(props.initialTab as TabType || 'block')

    const tabs = [
        { id: 'block', name: 'Time Blocks', icon: Clock },
        { id: 'queue', name: 'Tasks', icon: ListTodo },
        { id: 'projects', name: 'Projects', icon: Folder },
        { id: 'plan', name: 'Planning', icon: Calendar },
    ]

    // Format date for display
    const displayDate = new Date(props.selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })

    return (
        <div className="space-y-6 md:space-y-8 px-4 md:px-8 lg:px-12 py-6 md:py-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-white">Work</h1>
                        <p className="text-gray-400 mt-1 text-sm sm:text-base">
                            {activeTab === 'block' && displayDate}
                            {activeTab === 'queue' && 'Day-to-day tasks (1-2 days)'}
                            {activeTab === 'projects' && 'Large initiatives (1+ weeks)'}
                            {activeTab === 'plan' && 'Multi-scale planning system'}
                        </p>
                    </div>
                    {activeTab === 'block' && (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <NotificationManager variant="inline" />
                            <PomodoroTimer variant="inline" />
                            <WorkHoursConfig userId={props.userId} />
                        </div>
                    )}
                </div>

                {/* Motivational Quotes */}
                <PageQuotes quotes={props.quotes} />

                {/* Tab Buttons */}
                <div className="flex p-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`relative flex-1 min-w-[100px] py-3 px-4 sm:px-6 rounded-xl font-semibold transition-all flex items-center justify-center text-sm sm:text-base whitespace-nowrap ${
                                    isActive
                                        ? 'bg-zinc-800 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeWorkTab"
                                        className="absolute inset-0 bg-zinc-800 rounded-xl"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                <span className="relative z-10">{tab.name}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'block' && (
                    <motion.div
                        key="block"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        <ActiveProjects tasks={props.activeTasksForBlock} />
                        <BlockSchedule
                            blocks={props.timeBlocks}
                            selectedDate={props.selectedDate}
                            activeTasks={props.activeTasksForBlock}
                            workHours={props.workHours}
                            projects={props.projects}
                        />
                    </motion.div>
                )}

                {activeTab === 'queue' && (
                    <motion.div
                        key="queue"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="min-h-[calc(100vh-300px)]"
                    >
                        <QueueManager
                            activeTasks={props.activeTasks}
                            queuedTasks={props.queuedTasks}
                            completedTasks={props.completedTasks}
                            projects={props.projects}
                        />
                    </motion.div>
                )}

                {activeTab === 'projects' && (
                    <motion.div
                        key="projects"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ProjectManager
                            projects={props.projects}
                            quarterlyPlans={props.allQuarterlyPlans}
                            weeklyPlans={props.allWeeklyPlans}
                        />
                    </motion.div>
                )}

                {activeTab === 'plan' && (
                    <motion.div
                        key="plan"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PlanTabs
                            quarterlyPlan={props.quarterlyPlan}
                            weeklyPlan={props.weeklyPlan}
                            currentQuarter={props.currentQuarter}
                            weekStart={props.weekStart}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}


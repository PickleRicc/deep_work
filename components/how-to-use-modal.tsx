'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
    X, 
    Clock, 
    ListTodo, 
    Calendar, 
    MessageSquare, 
    BookOpen, 
    TrendingUp,
    Brain,
    Timer,
    Lightbulb,
    Target
} from 'lucide-react'
import { useAI } from '@/contexts/ai-context'

interface Feature {
    icon: any
    title: string
    description: string
    howTo: string
    inspiration: string
    inspirationFrom: string
}

const features: Feature[] = [
    {
        icon: Clock,
        title: 'Time Blocking',
        description: 'Schedule your deep work sessions by blocking out time on any day. See your current block at a glance and stay focused.',
        howTo: 'Navigate to any date, add time blocks for your tasks, and attach projects to blocks. Use the "Today" badge to quickly return to the current day. Give every minute of your work day a job.',
        inspiration: 'Time blocking ensures every minute of your day serves your priorities. By deciding in advance what you\'ll work on and when, you eliminate decision fatigue. It\'s not about having a to-do list—it\'s about confronting the reality of your available time and making intentional decisions.',
        inspirationFrom: 'Cal Newport - Time-Block Planning'
    },
    {
        icon: ListTodo,
        title: 'Task Queue (Pull System)',
        description: 'Manage your work with a Kanban-style board. Tasks flow from Queued → Active → Completed.',
        howTo: 'Add tasks with deadlines and notes. Move tasks between columns as you progress. Limit your active tasks to 2-3 items. When you finish one, pull a new task from the queued column.',
        inspiration: 'Instead of having work pushed onto you, pull work into your limited capacity. This "pull-based system" reduces administrative overhead and prevents the cognitive disorder of constantly switching between too many tasks. You\'ll finish things faster and maintain neuro-semantic coherence.',
        inspirationFrom: 'Cal Newport - Pull-Based Productivity'
    },
    {
        icon: Calendar,
        title: 'Planning (Multi-Scale)',
        description: 'Review your schedule and plan ahead. See all your time blocks and commitments at a glance.',
        howTo: 'Plan at three scales: Seasonal/Quarterly (big objectives), Weekly (confronting your calendar reality), and Daily (time blocking). Each smaller scale is informed by the larger one. Review your weekly plan every Monday, adjust as needed.',
        inspiration: 'Multi-scale planning ensures your bigger goals trickle down to influence what you do each hour. Think in decades, plan in seasons, execute in days. This approach is sustainable even when life gets chaotic—what you do tomorrow doesn\'t matter, but what you do this month does.',
        inspirationFrom: 'Cal Newport - Multi-Scale Planning & Slow Productivity'
    },
    {
        icon: MessageSquare,
        title: '{AI_NAME} Assistant',
        description: 'Chat with your AI that has full context of your schedule, tasks, notes, and behaviors. Get personalized insights.',
        howTo: 'Ask questions about your productivity, get suggestions for time allocation, request help organizing your work, or explore connections between your notes and concepts.',
        inspiration: 'Having an intelligent assistant that understands your entire workflow helps you make better decisions and spot patterns you might miss. It can help you avoid pseudo-productivity (appearing busy without being effective) and identify when you\'re experiencing cognitive disorder from too much context switching.',
        inspirationFrom: 'AI-Augmented Deep Work'
    },
    {
        icon: BookOpen,
        title: 'Notebook & Concept Map',
        description: 'Capture insights from books, podcasts, and your own ideas. Tag notes with concepts and projects. Visualize connections.',
        howTo: 'Create notes with a rich text editor. Tag them with concepts, link to projects. Switch to the Map tab to see AI-generated connections between your notes showing shared concepts and themes. Use active recall—after reading, try to remember key points before writing them down.',
        inspiration: 'Knowledge compounds when connected. By capturing insights and letting AI identify connections, you create an external knowledge graph like Obsidian\'s note linking. This supports solitude and deep thinking—periods free from stimuli created by other minds where original ideas emerge.',
        inspirationFrom: 'Obsidian (Concept Mapping) + Cal Newport (Solitude & Active Recall)'
    },
    {
        icon: TrendingUp,
        title: 'Behavior Tracking',
        description: 'Track behaviors that reward you vs. those that don\'t. Understand your personal reward system.',
        howTo: 'Add behaviors you want to track (daily, weekly, or monthly). Check them off when completed and rate how rewarding they felt. Review weekly to see patterns. Be honest about what actually rewards you, not what "should" reward you.',
        inspiration: 'People do things because those things reward them. The key insight is understanding what behaviors truly serve you by making you feel rewarded versus behaviors that drain you or provide false rewards. Track both "Rewards Me" and "Doesn\'t Reward Me" behaviors to build self-awareness and design a life aligned with genuine satisfaction.',
        inspirationFrom: 'Alex Hormozi - Understanding Reward Systems'
    },
    {
        icon: Timer,
        title: 'Pomodoro Timer',
        description: 'Stay focused with timed work sessions. Customize work and break durations.',
        howTo: 'Click the floating timer, choose preset or custom times, and start. The timer will notify you when to take breaks. Use during deep work blocks to maintain neuro-semantic coherence—the state where only relevant neural networks are active.',
        inspiration: 'Focused work in time-boxed intervals maximizes concentration and prevents burnout. Regular breaks maintain high performance. This supports "embracing boredom"—building tolerance for focused work without reaching for distractions. Deep work isn\'t flow state; it\'s hard, concentrated effort where you notice every second passing.',
        inspirationFrom: 'Francesco Cirillo (Pomodoro Technique) + Cal Newport (Deep Work & Boredom Tolerance)'
    }
]

const principles = [
    {
        icon: Brain,
        title: 'Deep Work',
        description: 'The ability to focus without distraction on cognitively demanding tasks. It\'s the superpower of the 21st century.'
    },
    {
        icon: Target,
        title: 'Intentionality',
        description: 'Every feature is designed to help you work with intention, not just reaction. Decide what matters, then execute.'
    },
    {
        icon: Lightbulb,
        title: 'Knowledge Building',
        description: 'Capture insights, connect ideas, and build a knowledge base that compounds over time.'
    }
]

interface HowToUseModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function HowToUseModal({ isOpen, onClose }: HowToUseModalProps) {
    const { aiName } = useAI()
    const [activeTab, setActiveTab] = useState<'features' | 'principles'>('features')
    
    // Replace AI name placeholder in features
    const dynamicFeatures = features.map(f => ({
        ...f,
        title: f.title.replace('{AI_NAME}', aiName)
    }))

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl my-8 shadow-2xl pointer-events-auto flex flex-col max-h-[calc(100vh-4rem)]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">How to Use Yinsen</h2>
                                    <p className="text-gray-400 text-sm">Master your focus, build your knowledge</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 px-6 pt-4 border-b border-zinc-800">
                                <button
                                    onClick={() => setActiveTab('features')}
                                    className={`px-4 py-2 font-medium transition-colors relative ${
                                        activeTab === 'features'
                                            ? 'text-blue-400'
                                            : 'text-gray-400 hover:text-gray-300'
                                    }`}
                                >
                                    Features
                                    {activeTab === 'features' && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                                        />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('principles')}
                                    className={`px-4 py-2 font-medium transition-colors relative ${
                                        activeTab === 'principles'
                                            ? 'text-blue-400'
                                            : 'text-gray-400 hover:text-gray-300'
                                    }`}
                                >
                                    Principles
                                    {activeTab === 'principles' && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                                        />
                                    )}
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {activeTab === 'features' ? (
                                    <div className="space-y-6">
                                        {dynamicFeatures.map((feature, index) => (
                                            <motion.div
                                                key={feature.title}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                                                        <feature.icon size={20} className="text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-white mb-1">
                                                                {feature.title}
                                                            </h3>
                                                            <p className="text-gray-400 text-sm">
                                                                {feature.description}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                                                                <p className="text-xs font-medium text-blue-400 mb-1">HOW TO USE</p>
                                                                <p className="text-sm text-gray-300">{feature.howTo}</p>
                                                            </div>

                                                            <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3">
                                                                <p className="text-xs font-medium text-purple-400 mb-1">WHY IT MATTERS</p>
                                                                <p className="text-sm text-gray-300 mb-2">{feature.inspiration}</p>
                                                                <p className="text-xs text-gray-500 italic">— {feature.inspirationFrom}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
                                            <h3 className="text-xl font-bold text-white mb-3">Core Philosophy</h3>
                                            <p className="text-gray-300 leading-relaxed mb-3">
                                                Yinsen is built on the philosophy that you shouldn't waste your life. This app helps you build 
                                                something meaningful by cultivating the ability to focus without distraction, 
                                                build a knowledge base that compounds over time, and understand what behaviors truly serve your goals.
                                            </p>
                                            <p className="text-gray-300 leading-relaxed">
                                                We reject "pseudo-productivity"—using visible activity as a proxy for useful effort. Instead, we embrace 
                                                intentional planning, limited work-in-progress, and the uncomfortable reality that deep work isn't "flow" 
                                                state—it's hard, deliberate practice where every second counts. Think in decades, plan in seasons, execute in days.
                                            </p>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-3">
                                            {principles.map((principle, index) => (
                                                <motion.div
                                                    key={principle.title}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
                                                >
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center mb-4">
                                                        <principle.icon size={24} className="text-blue-400" />
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-white mb-2">
                                                        {principle.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-400 leading-relaxed">
                                                        {principle.description}
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                            <h4 className="text-lg font-semibold text-white mb-3">Key Inspirations</h4>
                                            <div className="space-y-2 text-sm text-gray-400">
                                                <p><strong className="text-white">Cal Newport</strong> - Deep Work, Time-Block Planning, Multi-Scale Planning, Pull-Based Systems, Neuro-Semantic Coherence, Embracing Boredom, Solitude Deprivation</p>
                                                <p><strong className="text-white">Alex Hormozi</strong> - Understanding What Truly Rewards You</p>
                                                <p><strong className="text-white">Obsidian</strong> - Bi-directional Note Linking & Concept Mapping</p>
                                                <p><strong className="text-white">Francesco Cirillo</strong> - Pomodoro Technique</p>
                                                <p><strong className="text-white">Anders Ericsson</strong> - Deliberate Practice (via Cal Newport)</p>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
                                            <h4 className="text-lg font-semibold text-white mb-3">Tips for Consistency</h4>
                                            <ul className="space-y-2 text-sm text-gray-300">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-400 mt-1">•</span>
                                                    <span>Use multi-scale planning: Set quarterly goals, review them weekly, time-block daily</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-400 mt-1">•</span>
                                                    <span>Limit active tasks to 2-3 items. Pull new work only when you finish something</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-400 mt-1">•</span>
                                                    <span>Schedule communication (email, messages) in specific time blocks—don't check constantly</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-400 mt-1">•</span>
                                                    <span>Practice "embracing boredom"—take 20-minute breaks from all distraction daily</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-400 mt-1">•</span>
                                                    <span>Use active recall when capturing notes: read, walk away, try to remember, then write</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-400 mt-1">•</span>
                                                    <span>Review behavior tracking weekly—be honest about what actually rewards you</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-400 mt-1">•</span>
                                                    <span>Think in decades: What you do tomorrow doesn't matter; what you do this month does</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
                                <p className="text-center text-sm text-gray-500">
                                    Master your attention. Build your knowledge. Achieve your goals.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}


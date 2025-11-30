'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Bot, Send, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import IntakeQuestionnaire from '@/components/intake-questionnaire'
import { useAI } from '@/contexts/ai-context'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const quickActions = [
    'What should I work on now?',
    'Plan my day',
    'Add task: ',
    'Create a note about ',
]

export default function AIChatPanel() {
    const supabase = createClient()
    const { aiName, refreshAIName } = useAI()
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [showIntake, setShowIntake] = useState(false)
    const [hasProfile, setHasProfile] = useState<boolean | null>(null)
    const [userName, setUserName] = useState<string>('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Check if user has completed intake
    useEffect(() => {
        async function checkProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('intake_completed, display_name')
                .eq('user_id', user.id)
                .single()

            setHasProfile(profile?.intake_completed || false)
            setUserName(profile?.display_name || '')
        }
        checkProfile()
    }, [])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => textareaRef.current?.focus(), 100)
        }
    }, [isOpen])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            // Get user's timezone
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
            
            const response = await fetch('/api/claude/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMessage,
                    timezone: timezone 
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to get response')
            }

            const data = await response.json()
            setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
        } catch (error) {
            console.error('Error:', error)
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleQuickAction = (action: string) => {
        setInput(action)
        textareaRef.current?.focus()
    }

    return (
        <>
            {/* Intake Questionnaire Modal */}
            <IntakeQuestionnaire
                isOpen={showIntake}
                onClose={() => setShowIntake(false)}
                onComplete={() => {
                    setShowIntake(false)
                    setHasProfile(true)
                    window.location.reload()
                }}
            />

            {/* Floating Action Button - Desktop only (mobile uses dock) */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="hidden lg:flex fixed z-40 items-center justify-center transition-transform
                    bottom-8 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl shadow-blue-500/30 hover:scale-110"
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: isOpen ? 0 : 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
                <Bot size={24} />
            </motion.button>
            
            {/* Mobile FAB - Positioned above dock */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="lg:hidden fixed z-40 flex items-center justify-center
                    right-4 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl shadow-blue-500/30"
                style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0 }}
                animate={{ scale: isOpen ? 0 : 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
                <Bot size={22} />
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`fixed right-0 top-0 z-50 bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col ${
                                isExpanded ? 'w-full lg:w-[600px]' : 'w-full lg:w-[400px]'
                            }`}
                            style={{ 
                                height: '100%',
                                paddingTop: 'env(safe-area-inset-top)',
                                paddingBottom: 'env(safe-area-inset-bottom)'
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <Bot size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">{aiName}</h3>
                                        <p className="text-xs text-gray-400">Your productivity assistant</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="hidden lg:flex p-2 text-gray-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {messages.length === 0 && !loading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="text-center py-6">
                                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 mb-3">
                                                    <Bot size={28} className="text-blue-400" strokeWidth={1.5} />
                                                </div>
                                                <h2 className="text-lg font-bold text-white mb-1">
                                                    Hi{userName ? ` ${userName}` : ''}!
                                                </h2>
                                                <p className="text-gray-400 text-sm">
                                                    I can manage your schedule, tasks, notes & more.
                                                </p>
                                                {!hasProfile && (
                                                    <button
                                                        onClick={() => setShowIntake(true)}
                                                        className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-medium"
                                                    >
                                                        <Sparkles size={12} />
                                                        Complete profile
                                                    </button>
                                                )}
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="grid grid-cols-1 gap-2">
                                                {quickActions.map((action, index) => (
                                                    <motion.button
                                                        key={action}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        onClick={() => handleQuickAction(action)}
                                                        className="relative bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl p-3 text-left transition-all group"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles size={14} className="text-blue-400/70" />
                                                            <p className="text-white text-sm font-medium">
                                                                {action}
                                                            </p>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {messages.map((msg, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                                                    msg.role === 'user'
                                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                                                        : 'bg-zinc-800 border border-zinc-700 text-gray-200'
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {loading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex justify-start"
                                        >
                                            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3">
                                                <div className="flex gap-1.5">
                                                    {[0, 1, 2].map((i) => (
                                                        <motion.div
                                                            key={i}
                                                            className="w-2 h-2 bg-blue-400 rounded-full"
                                                            animate={{ y: [0, -6, 0] }}
                                                            transition={{
                                                                duration: 0.5,
                                                                repeat: Infinity,
                                                                delay: i * 0.1,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
                                <div className="flex gap-2">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask anything..."
                                        rows={1}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || loading}
                                        className="bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-gray-500 text-white px-4 py-2.5 rounded-xl transition-all flex items-center justify-center"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <p className="text-gray-600 text-[10px] mt-2 text-center">
                                    Enter to send • Shift+Enter for new line
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}


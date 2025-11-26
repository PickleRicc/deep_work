'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Bot, Send, Sparkles, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import IntakeQuestionnaire from '@/components/intake-questionnaire'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const quickActions = [
    'What should I work on now?',
    'Plan my day',
    'Pull next task',
    'Add task: ',
]

export default function ChatInterface() {
    const supabase = createClient()
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
            
            // Auto-show intake if not completed
            if (!profile?.intake_completed) {
                setShowIntake(true)
            }
        }
        checkProfile()
    }, [])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            const response = await fetch('/api/claude/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
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
                    // Refresh to get the new name
                    window.location.reload()
                }}
            />

            <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                <AnimatePresence mode="popLayout">
                    {messages.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 mb-4">
                                    <Bot size={40} className="text-blue-400" strokeWidth={1.5} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Hi{userName ? ` ${userName}` : ''}! How can I help?
                                </h2>
                                <p className="text-gray-400 mb-4">
                                    I can manage your schedule, tasks, and plans.
                                </p>
                                {!hasProfile && (
                                    <button
                                        onClick={() => setShowIntake(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all"
                                    >
                                        <Settings size={16} />
                                        Complete your profile for personalized assistance
                                    </button>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                {quickActions.map((action, index) => (
                                    <motion.button
                                        key={action}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleQuickAction(action)}
                                        className="relative bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-sm border border-zinc-800 hover:border-blue-500/50 rounded-xl p-4 text-left transition-all duration-300 group overflow-hidden shadow-lg hover:shadow-blue-500/10"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
                                        <div className="relative flex items-center gap-2">
                                            <Sparkles size={16} className="text-blue-400/70 group-hover:text-blue-400 transition-colors" />
                                            <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
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
                            transition={{ duration: 0.3 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-xl px-4 py-3 shadow-lg ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/20'
                                        : 'bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 text-gray-200 shadow-black/20'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}

                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl px-4 py-3 shadow-lg shadow-black/20">
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/30"
                                            animate={{
                                                y: [0, -8, 0],
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                repeat: Infinity,
                                                delay: i * 0.15,
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
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 shadow-xl shadow-black/20">
                <div className="flex gap-3">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Claude..."
                        rows={1}
                        className="flex-1 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:shadow-none flex items-center gap-2"
                    >
                        <span>Send</span>
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
        </>
    )
}

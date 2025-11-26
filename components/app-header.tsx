'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Brain, LogOut, User, MessageCircle, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import HowToUseModal from './how-to-use-modal'
import { useAI } from '@/contexts/ai-context'

const staticPageNames: Record<string, string> = {
    '/block': 'Time Blocking',
    '/queue': 'Work Queue',
    '/plan': 'Planning',
    '/notebook': 'Notebook',
    '/behavior': 'Behavior Tracking',
}

const quotes = [
    "Deep work is the ability to focus without distraction on a cognitively demanding task.",
    "Clarity about what matters provides clarity about what does not.",
    "The ability to perform deep work is becoming increasingly rare and increasingly valuable.",
    "Focus is a matter of deciding what things you're not going to do.",
    "The secret to getting ahead is getting started.",
    "Concentrate all your thoughts upon the work in hand.",
    "It's not about having time. It's about making time.",
    "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
]

export default function AppHeader() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { aiName } = useAI()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [quotesEnabled, setQuotesEnabled] = useState(true)
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
    const [isHowToOpen, setIsHowToOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem('quotesEnabled')
        if (saved !== null) {
            setQuotesEnabled(saved === 'true')
        }
    }, [])

    useEffect(() => {
        if (!quotesEnabled) return

        const interval = setInterval(() => {
            setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length)
        }, 10000)

        return () => clearInterval(interval)
    }, [quotesEnabled])

    const toggleQuotes = () => {
        const newValue = !quotesEnabled
        setQuotesEnabled(newValue)
        localStorage.setItem('quotesEnabled', String(newValue))
    }

    // Dynamic page name - use AI name for chat page
    const pageName = pathname === '/chat' 
        ? `${aiName} Assistant` 
        : (staticPageNames[pathname] || 'Deep Work')

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header 
            className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-xl"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="flex h-14 sm:h-16 items-center justify-between px-4 md:px-8 lg:px-12">
                {/* Logo and App Name */}
                <div className="flex items-center gap-4">
                    <motion.div
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Brain size={24} className="text-white" strokeWidth={2.5} />
                    </motion.div>
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-white">Deep Work</h1>
                            <p className="text-xs text-gray-500 hidden md:block">{pageName}</p>
                        </div>
                        
                        {/* Quote Display */}
                        {quotesEnabled && (
                            <div className="hidden lg:block ml-4 pl-4 border-l border-zinc-800">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={currentQuoteIndex}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="text-sm text-white/60 max-w-md italic"
                                    >
                                        "{quotes[currentQuoteIndex]}"
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* How to Use - Mobile Only */}
                    <button
                        onClick={() => setIsHowToOpen(true)}
                        className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-zinc-900/50 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                        title="How to use this app"
                    >
                        <HelpCircle size={18} />
                    </button>

                    {/* Quote Toggle */}
                    <button
                        onClick={toggleQuotes}
                        className={`hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            quotesEnabled
                                ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                : 'bg-zinc-900/50 text-gray-500 hover:text-gray-400'
                        }`}
                        title={quotesEnabled ? 'Hide quotes' : 'Show quotes'}
                    >
                        <MessageCircle size={16} />
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                    <motion.button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <User size={18} className="text-white" />
                        </div>
                        <span className="text-sm text-gray-300 hidden md:inline">Account</span>
                    </motion.button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden z-50"
                            >
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </motion.div>
                        </>
                    )}
                    </div>
                </div>
            </div>

            {/* How to Use Modal - Rendered via Portal */}
            {mounted && createPortal(
                <HowToUseModal isOpen={isHowToOpen} onClose={() => setIsHowToOpen(false)} />,
                document.body
            )}
        </header>
    )
}


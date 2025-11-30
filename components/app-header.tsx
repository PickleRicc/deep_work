'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { LogOut, User, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import HowToUseModal from './how-to-use-modal'
import HamburgerMenu from './hamburger-menu'
import { useAI } from '@/contexts/ai-context'

const staticPageNames: Record<string, string> = {
    '/block': 'Time Blocking',
    '/queue': 'Work Queue',
    '/plan': 'Planning',
    '/notebook': 'Notebook',
    '/behavior': 'Behavior Tracking',
}

// Yinsen Philosophy - Inspired by the character who told Tony Stark not to waste his life
const yinsenPhilosophy = "Don't waste your life. Every moment is an opportunity to build something meaningful."

export default function AppHeader() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { aiName } = useAI()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isHowToOpen, setIsHowToOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Dynamic page name - use AI name for chat page
    const pageName = pathname === '/chat' 
        ? `${aiName} Assistant` 
        : (staticPageNames[pathname] || 'Yinsen')

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
                        className="flex lg:hidden items-center justify-center w-10 h-10 rounded-2xl overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <img src="/yinsen_logo_blue.png" alt="Yinsen" className="w-full h-full object-contain" />
                    </motion.div>
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-white lg:hidden">Yinsen</h1>
                            <p className="text-xs text-gray-500 hidden md:block lg:text-base lg:text-white">{pageName}</p>
                        </div>
                        
                        {/* Yinsen Philosophy */}
                        <div className="hidden lg:block ml-4 pl-4 border-l border-zinc-800">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-blue-400/80 max-w-md font-medium"
                            >
                                {yinsenPhilosophy}
                            </motion.p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Hamburger Menu - Analytics, Reviews, Behavior */}
                    <HamburgerMenu />

                    {/* How to Use - Mobile Only */}
                    <button
                        onClick={() => setIsHowToOpen(true)}
                        className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-zinc-900/50 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                        title="How to use this app"
                    >
                        <HelpCircle size={18} />
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


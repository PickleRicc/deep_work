'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Clock, MessageSquare, Brain, BookOpen, TrendingUp, BarChart3, HelpCircle } from 'lucide-react'
import HowToUseModal from './how-to-use-modal'

const navItems = [
    { name: 'Home', icon: Brain, href: '/home' },
    { name: 'Work', icon: Clock, href: '/work' },
    { name: 'Chat', icon: MessageSquare, href: '/chat' },
    { name: 'Notebook', icon: BookOpen, href: '/notebook' },
    { name: 'Behavior', icon: TrendingUp, href: '/behavior' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
]

export default function DesktopNav() {
    const pathname = usePathname()
    const [isHowToOpen, setIsHowToOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-zinc-800 bg-black/50 backdrop-blur-xl z-30">
            {/* Logo Section */}
            <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
                        <Brain size={24} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Deep Work</h2>
                        <p className="text-xs text-gray-500">Focus System</p>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative block"
                        >
                            <motion.div
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                    isActive
                                        ? 'text-blue-400'
                                        : 'text-gray-400 hover:text-white hover:bg-zinc-900/50'
                                }`}
                                whileHover={{ x: 4 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeDesktopNav"
                                        className="absolute inset-0 bg-blue-500/10 rounded-xl border border-blue-500/20"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                <Icon
                                    size={20}
                                    className="relative z-10"
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className="relative z-10 font-medium">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeDesktopDot"
                                        className="absolute right-4 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 space-y-3">
                {/* Guide Button */}
                <button
                    onClick={() => setIsHowToOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                >
                    <HelpCircle size={20} />
                    <span className="font-medium">How to Use</span>
                </button>

                <div className="px-4 py-3 text-xs text-gray-600">
                    <p>Built for deep focus</p>
                    <p className="mt-1">© 2024 Deep Work</p>
                </div>
            </div>

            {/* How to Use Modal - Rendered via Portal */}
            {mounted && createPortal(
                <HowToUseModal isOpen={isHowToOpen} onClose={() => setIsHowToOpen(false)} />,
                document.body
            )}
        </aside>
    )
}


'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Clock, MessageSquare, Brain, BookOpen, TrendingUp, BarChart3 } from 'lucide-react'

const tabs = [
    { name: 'Home', icon: Brain, href: '/home' },
    { name: 'Work', icon: Clock, href: '/work' },
    { name: 'Chat', icon: MessageSquare, href: '/chat' },
    { name: 'Notes', icon: BookOpen, href: '/notebook' },
    { name: 'Behavior', icon: TrendingUp, href: '/behavior' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="lg:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-[72px] z-50">
            {/* Main Nav Container - leaves space for AI button on right */}
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-1.5">
                <div className="flex items-center justify-between">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href
                        const Icon = tab.icon

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="relative flex items-center justify-center flex-1 h-10 rounded-xl transition-all duration-200 active:scale-95"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-blue-500/20 rounded-xl border border-blue-500/30"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                <span className={`relative z-10 transition-colors duration-200 ${
                                    isActive ? 'text-blue-400' : 'text-gray-500'
                                }`}>
                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}

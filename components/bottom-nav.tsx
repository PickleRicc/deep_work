'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Clock, MessageSquare, Brain, BookOpen, TrendingUp, BarChart3, Home } from 'lucide-react'

const tabs = [
    { name: 'Home', icon: Home, href: '/home' },
    { name: 'Work', icon: Clock, href: '/work' },
    { name: 'Chat', icon: MessageSquare, href: '/chat' },
    { name: 'Notes', icon: BookOpen, href: '/notebook' },
    { name: 'Behavior', icon: TrendingUp, href: '/behavior' },
    { name: 'Stats', icon: BarChart3, href: '/analytics' },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            {/* Safe area background - extends to bottom of screen */}
            <div className="pointer-events-auto">
                {/* Gradient fade at top */}
                <div className="h-8 bg-gradient-to-t from-black/90 to-transparent" />
                
                {/* Main dock container */}
                <div className="bg-black/90 backdrop-blur-2xl border-t border-white/5 px-2 pt-2" 
                     style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
                    <div className="flex items-center justify-around max-w-md mx-auto">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href || 
                                (tab.href === '/work' && ['/block', '/queue', '/plan'].includes(pathname))
                            const Icon = tab.icon

                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-90 active:opacity-70"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabMobile"
                                            className="absolute inset-0 bg-white/10 rounded-xl"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 500,
                                                damping: 35,
                                            }}
                                        />
                                    )}
                                    <span className={`relative z-10 transition-colors duration-200 ${
                                        isActive ? 'text-blue-400' : 'text-gray-500'
                                    }`}>
                                        <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                                    </span>
                                    <span className={`relative z-10 text-[10px] mt-0.5 font-medium transition-colors duration-200 ${
                                        isActive ? 'text-blue-400' : 'text-gray-500'
                                    }`}>
                                        {tab.name}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </nav>
    )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Clock, ListTodo, Calendar, MessageSquare } from 'lucide-react'

const tabs = [
    { name: 'Block', icon: Clock, href: '/block' },
    { name: 'Queue', icon: ListTodo, href: '/queue' },
    { name: 'Plan', icon: Calendar, href: '/plan' },
    { name: 'Chat', icon: MessageSquare, href: '/chat' },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50 px-2 py-2">
                <div className="flex items-center gap-1">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href
                        const Icon = tab.icon

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="relative flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300 hover:scale-110 group"
                            >
                                {isActive && (
                                    <>
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white/10 rounded-full border border-white/5 shadow-lg shadow-blue-500/20"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 380,
                                                damping: 30,
                                            }}
                                        />
                                        <motion.div
                                            layoutId="activeGlow"
                                            className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 380,
                                                damping: 30,
                                            }}
                                        />
                                    </>
                                )}
                                <span className={`relative z-10 transition-all duration-300 ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </span>
                                <span
                                    className={`text-[10px] font-medium relative z-10 mt-0.5 transition-colors duration-300 ${isActive ? 'text-blue-200' : 'text-gray-500'
                                        }`}
                                >
                                    {tab.name}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeDot"
                                        className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}

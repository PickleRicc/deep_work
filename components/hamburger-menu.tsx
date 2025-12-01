'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X, BarChart3, Star, TrendingUp } from 'lucide-react'

const menuItems = [
    { name: 'Analytics', icon: BarChart3, href: '/analytics', description: 'View your productivity stats' },
    { name: 'Reviews', icon: Star, href: '/reviews', description: 'Review completed work' },
    { name: 'Behavior', icon: TrendingUp, href: '/behavior', description: 'Track your habits' },
]

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    // Close menu when navigating
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    return (
        <div ref={menuRef} className="relative">
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                aria-label="Menu"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X size={20} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="menu"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Menu size={20} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                    >
                        <div className="p-2">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="relative block"
                                    >
                                        <motion.div
                                            className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-colors ${
                                                isActive
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                                            }`}
                                            whileHover={{ x: 2 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        >
                                            <Icon
                                                size={20}
                                                className="mt-0.5 flex-shrink-0"
                                                strokeWidth={isActive ? 2.5 : 2}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {item.description}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeMenuItem"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50"
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
                        <div className="border-t border-zinc-800 px-4 py-2 bg-zinc-950">
                            <p className="text-xs text-gray-600">Advanced Features</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}



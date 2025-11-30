'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Quote } from 'lucide-react'

interface PageQuotesProps {
    quotes: string[]
    intervalMs?: number
}

export default function PageQuotes({ quotes, intervalMs = 12000 }: PageQuotesProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const saved = localStorage.getItem('pageQuotesVisible')
        if (saved !== null) {
            setIsVisible(saved === 'true')
        }
    }, [])

    useEffect(() => {
        if (!isVisible) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % quotes.length)
        }, intervalMs)

        return () => clearInterval(interval)
    }, [isVisible, quotes.length, intervalMs])

    const toggleVisibility = () => {
        const newValue = !isVisible
        setIsVisible(newValue)
        localStorage.setItem('pageQuotesVisible', String(newValue))
    }

    if (!isVisible) {
        return (
            <button
                onClick={toggleVisibility}
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 text-gray-500 hover:text-blue-400 hover:border-blue-500/30 transition-all text-sm flex items-center justify-center gap-2 font-medium"
                title="Show quotes"
            >
                <Quote size={16} />
                <span>Show Quotes</span>
            </button>
        )
    }

    return (
        <div className="relative bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 md:p-6">
            <button
                onClick={toggleVisibility}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-zinc-800 transition-all text-xs font-medium"
                title="Hide quotes"
            >
                <Quote size={14} />
                <span className="hidden sm:inline">Hide</span>
            </button>
            
            <div className="pr-20 sm:pr-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-start gap-3"
                    >
                        <div className="flex-shrink-0 w-1 h-12 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
                        <p className="text-sm md:text-base text-gray-300 italic leading-relaxed">
                            "{quotes[currentIndex]}"
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {/* Progress Dots */}
            {quotes.length > 1 && (
                <div className="flex gap-1.5 mt-4 justify-center">
                    {quotes.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                                idx === currentIndex
                                    ? 'bg-blue-500 w-6'
                                    : 'bg-zinc-700 hover:bg-zinc-600'
                            }`}
                            aria-label={`Go to quote ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// Pre-defined quote sets for different pages
export const homeQuotes = [
    "Don't waste your life. Every moment is an opportunity to build something meaningful.",
    "Focus is the foundation of excellence. Without it, talent and effort scatter.",
    "The quality of your attention determines the quality of your life.",
    "Deep focus isn't about working harder—it's about working with intention.",
    "Your life is measured not in time, but in meaningful moments of creation.",
    "The ability to concentrate is a superpower in a world designed for distraction.",
]

export const workQuotes = [
    "Time blocking transforms intention into reality. What you schedule, you honor.",
    "Projects aren't completed in marathons—they're built block by block, day by day.",
    "Breaking down overwhelming goals into clear tasks is the bridge between dreams and achievement.",
    "Your calendar reflects your priorities. Does it show what truly matters?",
    "Multi-scale planning gives you both vision for the future and clarity for today.",
    "The magic isn't in doing more—it's in doing what matters most, at the right time.",
    "Limiting work-in-progress isn't about doing less. It's about finishing what you start.",
]

export const behaviorQuotes = [
    "You don't rise to the level of your goals—you fall to the level of your systems.",
    "Behavior tracking reveals patterns. Patterns reveal truth. Truth enables change.",
    "Rewards aren't bribes—they're recognition of progress and fuel for momentum.",
    "The habits you cultivate today become the person you are tomorrow.",
    "Success isn't a result. It's a consequence of daily behavior repeated over time.",
    "What gets measured gets managed. What gets rewarded gets repeated.",
    "Small improvements compound. Track them, celebrate them, protect them.",
]


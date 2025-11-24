'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Timer, Play, Pause, RotateCcw, X, Coffee, Briefcase } from 'lucide-react'

type TimerMode = 'work' | 'shortBreak' | 'longBreak' | 'custom'

const TIMER_DURATIONS = {
    work: 25 * 60, // 25 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 15 * 60, // 15 minutes
    custom: 30 * 60, // Default 30 minutes
}

const TIMER_COLORS = {
    work: {
        primary: 'from-orange-500 to-red-600',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
    },
    shortBreak: {
        primary: 'from-green-500 to-emerald-600',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        text: 'text-green-400',
    },
    longBreak: {
        primary: 'from-blue-500 to-cyan-600',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
    },
    custom: {
        primary: 'from-purple-500 to-pink-600',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
    },
}

export default function PomodoroTimer() {
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<TimerMode>('work')
    const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.work)
    const [isRunning, setIsRunning] = useState(false)
    const [completedPomodoros, setCompletedPomodoros] = useState(0)
    const [customMinutes, setCustomMinutes] = useState(30)
    const [showCustomInput, setShowCustomInput] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Create audio element for completion sound
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZSR0PTKXh8bllHAU2jdXxzn4qBSh+zPDckj0JFmK56+moVBMJR5/f87llHAU2jtXy0H4qBSh+zPDckj0JFmK56+moVBMJR5/f87llHAU2jtXy0H4qBSh+zPDckj0JFmK56+moVBMJR5/f87llHAU2jtXy0H4qBSh+zPDckj0JFmK56+moVBMJR5/f8w==')
        }
    }, [])

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            handleTimerComplete()
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning, timeLeft])

    const handleTimerComplete = () => {
        setIsRunning(false)
        
        // Play sound
        if (audioRef.current) {
            audioRef.current.play().catch(() => {})
        }

        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Complete!', {
                body: mode === 'work' ? 'Great work! Time for a break.' : 'Break over! Ready to focus?',
                icon: '/favicon.ico',
            })
        }

        // Auto-switch modes
        if (mode === 'work') {
            setCompletedPomodoros((prev) => prev + 1)
            const nextMode = (completedPomodoros + 1) % 4 === 0 ? 'longBreak' : 'shortBreak'
            setMode(nextMode)
            setTimeLeft(TIMER_DURATIONS[nextMode])
        } else {
            setMode('work')
            setTimeLeft(TIMER_DURATIONS.work)
        }
    }

    const handleModeChange = (newMode: TimerMode) => {
        setMode(newMode)
        if (newMode === 'custom') {
            setTimeLeft(customMinutes * 60)
            setShowCustomInput(true)
        } else {
            setTimeLeft(TIMER_DURATIONS[newMode])
            setShowCustomInput(false)
        }
        setIsRunning(false)
    }

    const handleCustomMinutesChange = (minutes: number) => {
        if (minutes > 0 && minutes <= 180) { // Max 3 hours
            setCustomMinutes(minutes)
            if (mode === 'custom') {
                setTimeLeft(minutes * 60)
            }
        }
    }

    const handleToggle = () => {
        if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
        setIsRunning(!isRunning)
    }

    const handleReset = () => {
        setIsRunning(false)
        setTimeLeft(TIMER_DURATIONS[mode])
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const progress = ((TIMER_DURATIONS[mode] - timeLeft) / TIMER_DURATIONS[mode]) * 100
    const colors = TIMER_COLORS[mode]

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 lg:bottom-8 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-2xl shadow-orange-500/30 flex items-center justify-center hover:scale-110 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
                <Timer size={24} />
            </motion.button>

            {/* Timer Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`${colors.bg} ${colors.border} border-2 rounded-3xl p-8 w-full max-w-md shadow-2xl backdrop-blur-xl`}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                    {mode === 'work' ? <Briefcase size={24} /> : <Coffee size={24} />}
                                    Pomodoro Timer
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Mode Selector */}
                            <div className="grid grid-cols-4 gap-2 mb-8">
                                <button
                                    onClick={() => handleModeChange('work')}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                                        mode === 'work'
                                            ? 'bg-orange-500 text-white shadow-lg'
                                            : 'bg-zinc-900/50 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Work
                                </button>
                                <button
                                    onClick={() => handleModeChange('shortBreak')}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                                        mode === 'shortBreak'
                                            ? 'bg-green-500 text-white shadow-lg'
                                            : 'bg-zinc-900/50 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Short
                                </button>
                                <button
                                    onClick={() => handleModeChange('longBreak')}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                                        mode === 'longBreak'
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-zinc-900/50 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Long
                                </button>
                                <button
                                    onClick={() => handleModeChange('custom')}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                                        mode === 'custom'
                                            ? 'bg-purple-500 text-white shadow-lg'
                                            : 'bg-zinc-900/50 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Custom
                                </button>
                            </div>

                            {/* Custom Time Input */}
                            {showCustomInput && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-8 flex items-center justify-center gap-3"
                                >
                                    <label className="text-sm text-gray-400">Minutes:</label>
                                    <input
                                        type="number"
                                        value={customMinutes}
                                        onChange={(e) => handleCustomMinutesChange(parseInt(e.target.value) || 0)}
                                        min="1"
                                        max="180"
                                        className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-purple-500"
                                    />
                                </motion.div>
                            )}

                            {/* Circular Progress */}
                            <div className="relative w-64 h-64 mx-auto mb-8">
                                <svg className="w-full h-full transform -rotate-90">
                                    {/* Background circle */}
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="120"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-zinc-800"
                                    />
                                    {/* Progress circle */}
                                    <motion.circle
                                        cx="128"
                                        cy="128"
                                        r="120"
                                        stroke="url(#gradient)"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: progress / 100 }}
                                        transition={{ duration: 0.5 }}
                                        style={{
                                            strokeDasharray: '754',
                                            strokeDashoffset: 754 * (1 - progress / 100),
                                        }}
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" className={mode === 'work' ? 'text-orange-500' : mode === 'shortBreak' ? 'text-green-500' : 'text-blue-500'} stopColor="currentColor" />
                                            <stop offset="100%" className={mode === 'work' ? 'text-red-600' : mode === 'shortBreak' ? 'text-emerald-600' : 'text-cyan-600'} stopColor="currentColor" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Time Display */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <motion.div
                                        key={timeLeft}
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        className="text-6xl font-bold text-white"
                                    >
                                        {formatTime(timeLeft)}
                                    </motion.div>
                                    <div className="text-gray-400 text-sm mt-2">
                                        {mode === 'work' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : 'Custom Timer'}
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <motion.button
                                    onClick={handleToggle}
                                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors.primary} text-white shadow-lg flex items-center justify-center`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                                </motion.button>
                                <motion.button
                                    onClick={handleReset}
                                    className="w-12 h-12 rounded-full bg-zinc-900/50 text-gray-400 hover:text-white flex items-center justify-center border border-zinc-800"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <RotateCcw size={20} />
                                </motion.button>
                            </div>

                            {/* Stats */}
                            <div className="text-center">
                                <div className="text-sm text-gray-400">Completed Today</div>
                                <div className={`text-3xl font-bold ${colors.text} mt-1`}>
                                    {completedPomodoros}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}


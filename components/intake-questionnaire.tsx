'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Sparkles,
    Sun,
    Moon,
    Sunrise,
    Clock,
    Briefcase,
    Building2,
    GraduationCap,
    User,
    Heart,
    Brain,
    Target,
    ChevronRight,
    ChevronLeft,
    Check,
    X
} from 'lucide-react'

interface IntakeQuestionnaireProps {
    isOpen: boolean
    onClose: () => void
    onComplete: () => void
}

const WORK_STYLES = [
    { value: 'focused_blocks', label: 'Focused Blocks', description: 'I prefer long, uninterrupted deep work sessions', icon: Clock },
    { value: 'flexible_sprints', label: 'Flexible Sprints', description: 'I work in shorter bursts with frequent breaks', icon: Briefcase },
    { value: 'task_switching', label: 'Task Switching', description: 'I juggle multiple projects throughout the day', icon: Target },
]

const CHRONOTYPES = [
    { value: 'early_bird', label: 'Early Bird', description: 'I\'m most productive in the morning', icon: Sunrise },
    { value: 'night_owl', label: 'Night Owl', description: 'I do my best work late at night', icon: Moon },
    { value: 'flexible', label: 'Flexible', description: 'My energy levels are consistent throughout the day', icon: Sun },
]

const EMPLOYMENT_TYPES = [
    { value: 'business_owner', label: 'Business Owner', icon: Briefcase },
    { value: 'employee', label: 'Employee', icon: Building2 },
    { value: 'freelancer', label: 'Freelancer', icon: User },
    { value: 'student', label: 'Student', icon: GraduationCap },
    { value: 'other', label: 'Other', icon: Target },
]

const HEALTH_CONSIDERATIONS = [
    { value: 'adhd', label: 'ADHD' },
    { value: 'anxiety', label: 'Anxiety' },
    { value: 'depression', label: 'Depression' },
    { value: 'chronic_fatigue', label: 'Chronic Fatigue' },
    { value: 'chronic_pain', label: 'Chronic Pain' },
    { value: 'neurodivergent', label: 'Neurodivergent' },
    { value: 'none', label: 'None of the above' },
]

const REMINDER_STYLES = [
    { value: 'gentle', label: 'Gentle', description: 'Soft, encouraging reminders' },
    { value: 'assertive', label: 'Assertive', description: 'Direct, action-oriented nudges' },
    { value: 'minimal', label: 'Minimal', description: 'Only essential notifications' },
    { value: 'none', label: 'None', description: 'No reminders at all' },
]

const AI_PERSONALITIES = [
    { value: 'supportive', label: 'Supportive', description: 'Encouraging and positive', icon: Heart },
    { value: 'direct', label: 'Direct', description: 'Straightforward and honest', icon: Target },
    { value: 'analytical', label: 'Analytical', description: 'Data-driven and logical', icon: Brain },
    { value: 'motivational', label: 'Motivational', description: 'High-energy and inspiring', icon: Sparkles },
]

export default function IntakeQuestionnaire({ isOpen, onClose, onComplete }: IntakeQuestionnaireProps) {
    const router = useRouter()
    const supabase = createClient()
    const [step, setStep] = useState(0)
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [displayName, setDisplayName] = useState('')
    const [workStyle, setWorkStyle] = useState<string>('')
    const [preferredWorkDuration, setPreferredWorkDuration] = useState(90)
    const [preferredBreakDuration, setPreferredBreakDuration] = useState(15)
    const [chronotype, setChronotype] = useState<string>('')
    const [peakHoursStart, setPeakHoursStart] = useState('09:00')
    const [peakHoursEnd, setPeakHoursEnd] = useState('12:00')
    const [employmentType, setEmploymentType] = useState<string>('')
    const [hasFixedSchedule, setHasFixedSchedule] = useState(false)
    const [typicalWorkStart, setTypicalWorkStart] = useState('09:00')
    const [typicalWorkEnd, setTypicalWorkEnd] = useState('17:00')
    const [motivations, setMotivations] = useState<string[]>([])
    const [newMotivation, setNewMotivation] = useState('')
    const [goalsShortTerm, setGoalsShortTerm] = useState('')
    const [goalsLongTerm, setGoalsLongTerm] = useState('')
    const [hasCaregiving, setHasCaregiving] = useState(false)
    const [healthConsiderations, setHealthConsiderations] = useState<string[]>([])
    const [accommodationPreferences, setAccommodationPreferences] = useState('')
    const [reminderStyle, setReminderStyle] = useState('gentle')
    const [aiName, setAiName] = useState('Claude')
    const [aiPersonality, setAiPersonality] = useState('supportive')
    const [wantsAccountability, setWantsAccountability] = useState(true)
    const [wantsSuggestions, setWantsSuggestions] = useState(true)
    const [wantsInsights, setWantsInsights] = useState(true)

    const STEPS = [
        { title: 'Welcome', description: 'Let\'s get to know you' },
        { title: 'Work Style', description: 'How do you prefer to work?' },
        { title: 'Schedule', description: 'When are you at your best?' },
        { title: 'Employment', description: 'Your work context' },
        { title: 'Motivations', description: 'What drives you?' },
        { title: 'Health', description: 'Accommodations you might need' },
        { title: 'AI Preferences', description: 'How should I communicate?' },
        { title: 'Complete', description: 'You\'re all set!' },
    ]

    const handleAddMotivation = () => {
        if (newMotivation.trim() && !motivations.includes(newMotivation.trim())) {
            setMotivations([...motivations, newMotivation.trim()])
            setNewMotivation('')
        }
    }

    const toggleHealthConsideration = (value: string) => {
        if (value === 'none') {
            setHealthConsiderations(['none'])
        } else {
            const filtered = healthConsiderations.filter(h => h !== 'none')
            if (filtered.includes(value)) {
                setHealthConsiderations(filtered.filter(h => h !== value))
            } else {
                setHealthConsiderations([...filtered, value])
            }
        }
    }

    const handleSave = async () => {
        setIsSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.error('No user found')
                return
            }

            console.log('Saving profile for user:', user.id)

            const profileData = {
                user_id: user.id,
                display_name: displayName || null,
                work_style: workStyle || null,
                preferred_work_duration: preferredWorkDuration,
                preferred_break_duration: preferredBreakDuration,
                chronotype: chronotype || null,
                peak_hours_start: peakHoursStart + ':00',
                peak_hours_end: peakHoursEnd + ':00',
                employment_type: employmentType || null,
                has_fixed_schedule: hasFixedSchedule,
                typical_work_start: typicalWorkStart + ':00',
                typical_work_end: typicalWorkEnd + ':00',
                motivations: motivations.length > 0 ? motivations : null,
                goals_short_term: goalsShortTerm || null,
                goals_long_term: goalsLongTerm || null,
                has_caregiving_responsibilities: hasCaregiving,
                health_considerations: healthConsiderations.filter(h => h !== 'none').length > 0 
                    ? healthConsiderations.filter(h => h !== 'none') 
                    : null,
                accommodation_preferences: accommodationPreferences || null,
                reminder_style: reminderStyle,
                ai_name: aiName || 'Claude',
                ai_personality: aiPersonality,
                wants_accountability: wantsAccountability,
                wants_suggestions: wantsSuggestions,
                wants_insights: wantsInsights,
                notifications_enabled: true,
                notify_before_block: 5,
                intake_completed: true,
                intake_completed_at: new Date().toISOString(),
            }

            console.log('Profile data to save:', profileData)

            const { data, error } = await supabase
                .from('user_profiles')
                .upsert(profileData, {
                    onConflict: 'user_id'
                })
                .select()

            if (error) {
                console.error('Supabase error saving profile:', error)
                alert(`Error saving profile: ${error.message}`)
                return
            }

            console.log('Profile saved successfully:', data)
            onComplete()
        } catch (error) {
            console.error('Error saving profile:', error)
            alert('An error occurred while saving your profile. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const canProceed = () => {
        switch (step) {
            case 0: return true
            case 1: return !!workStyle
            case 2: return !!chronotype
            case 3: return !!employmentType
            case 4: return true
            case 5: return true
            case 6: return true
            case 7: return true
            default: return true
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-zinc-800 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{STEPS[step].title}</h2>
                                <p className="text-sm text-gray-400">{STEPS[step].description}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-1 mt-4">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-1 rounded-full transition-colors ${
                                    i <= step ? 'bg-blue-500' : 'bg-zinc-700'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {/* Step 0: Welcome */}
                        {step === 0 && (
                            <motion.div
                                key="step-0"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center py-8">
                                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                        <Sparkles size={48} className="text-blue-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3">Welcome to Deep Work</h3>
                                    <p className="text-gray-400 max-w-md mx-auto">
                                        I&apos;m your AI productivity partner. Let me learn about you so I can provide personalized guidance.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">What should I call you?</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your name..."
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: Work Style */}
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-gray-400 mb-4">How do you prefer to structure your work?</p>
                                
                                {WORK_STYLES.map((style) => (
                                    <button
                                        key={style.value}
                                        onClick={() => setWorkStyle(style.value)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                                            workStyle === style.value
                                                ? 'bg-blue-500/20 border-blue-500/50'
                                                : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            workStyle === style.value ? 'bg-blue-500/30' : 'bg-zinc-700'
                                        }`}>
                                            <style.icon size={20} className={workStyle === style.value ? 'text-blue-400' : 'text-gray-400'} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">{style.label}</h4>
                                            <p className="text-sm text-gray-400">{style.description}</p>
                                        </div>
                                        {workStyle === style.value && (
                                            <Check size={20} className="ml-auto text-blue-400" />
                                        )}
                                    </button>
                                ))}

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Work session (min)</label>
                                        <input
                                            type="number"
                                            value={preferredWorkDuration}
                                            onChange={(e) => setPreferredWorkDuration(parseInt(e.target.value) || 90)}
                                            min={15}
                                            max={240}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Break (min)</label>
                                        <input
                                            type="number"
                                            value={preferredBreakDuration}
                                            onChange={(e) => setPreferredBreakDuration(parseInt(e.target.value) || 15)}
                                            min={5}
                                            max={60}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Schedule/Chronotype */}
                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-gray-400 mb-4">When are you most productive?</p>
                                
                                {CHRONOTYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setChronotype(type.value)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                                            chronotype === type.value
                                                ? 'bg-blue-500/20 border-blue-500/50'
                                                : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            chronotype === type.value ? 'bg-blue-500/30' : 'bg-zinc-700'
                                        }`}>
                                            <type.icon size={20} className={chronotype === type.value ? 'text-blue-400' : 'text-gray-400'} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">{type.label}</h4>
                                            <p className="text-sm text-gray-400">{type.description}</p>
                                        </div>
                                        {chronotype === type.value && (
                                            <Check size={20} className="ml-auto text-blue-400" />
                                        )}
                                    </button>
                                ))}

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Peak hours start</label>
                                        <input
                                            type="time"
                                            value={peakHoursStart}
                                            onChange={(e) => setPeakHoursStart(e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Peak hours end</label>
                                        <input
                                            type="time"
                                            value={peakHoursEnd}
                                            onChange={(e) => setPeakHoursEnd(e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Employment */}
                        {step === 3 && (
                            <motion.div
                                key="step-3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-gray-400 mb-4">What&apos;s your work context?</p>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    {EMPLOYMENT_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setEmploymentType(type.value)}
                                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                                employmentType === type.value
                                                    ? 'bg-blue-500/20 border-blue-500/50'
                                                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                            }`}
                                        >
                                            <type.icon size={20} className={employmentType === type.value ? 'text-blue-400' : 'text-gray-400'} />
                                            <span className="text-white">{type.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-4 space-y-4">
                                    <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasFixedSchedule}
                                            onChange={(e) => setHasFixedSchedule(e.target.checked)}
                                            className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500"
                                        />
                                        <span className="text-white">I have a fixed schedule (e.g., 9-5)</span>
                                    </label>

                                    {hasFixedSchedule && (
                                        <div className="grid grid-cols-2 gap-4 pl-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Work starts</label>
                                                <input
                                                    type="time"
                                                    value={typicalWorkStart}
                                                    onChange={(e) => setTypicalWorkStart(e.target.value)}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Work ends</label>
                                                <input
                                                    type="time"
                                                    value={typicalWorkEnd}
                                                    onChange={(e) => setTypicalWorkEnd(e.target.value)}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Motivations */}
                        {step === 4 && (
                            <motion.div
                                key="step-4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-gray-400 mb-4">What motivates you to do your best work?</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {motivations.map((m, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm flex items-center gap-2"
                                        >
                                            {m}
                                            <button onClick={() => setMotivations(motivations.filter((_, j) => j !== i))}>
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMotivation}
                                        onChange={(e) => setNewMotivation(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMotivation())}
                                        placeholder="Add a motivation (e.g., family, freedom, impact)..."
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                                    />
                                    <button
                                        onClick={handleAddMotivation}
                                        disabled={!newMotivation.trim()}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white rounded-lg"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Short-term goals (next 3 months)</label>
                                        <textarea
                                            value={goalsShortTerm}
                                            onChange={(e) => setGoalsShortTerm(e.target.value)}
                                            placeholder="What do you want to accomplish soon?"
                                            rows={2}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Long-term goals (1-5 years)</label>
                                        <textarea
                                            value={goalsLongTerm}
                                            onChange={(e) => setGoalsLongTerm(e.target.value)}
                                            placeholder="What's your bigger vision?"
                                            rows={2}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 resize-none"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Health */}
                        {step === 5 && (
                            <motion.div
                                key="step-5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-gray-400 mb-4">Do you have any conditions that affect how you work?</p>

                                <div className="grid grid-cols-2 gap-3">
                                    {HEALTH_CONSIDERATIONS.map((h) => (
                                        <button
                                            key={h.value}
                                            onClick={() => toggleHealthConsideration(h.value)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                                healthConsiderations.includes(h.value)
                                                    ? 'bg-blue-500/20 border-blue-500/50'
                                                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                                                healthConsiderations.includes(h.value)
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-zinc-600'
                                            }`}>
                                                {healthConsiderations.includes(h.value) && <Check size={12} className="text-white" />}
                                            </div>
                                            <span className="text-white text-sm">{h.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {healthConsiderations.length > 0 && !healthConsiderations.includes('none') && (
                                    <div className="pt-4">
                                        <label className="block text-sm font-medium text-gray-400 mb-2">How can I best support you?</label>
                                        <textarea
                                            value={accommodationPreferences}
                                            onChange={(e) => setAccommodationPreferences(e.target.value)}
                                            placeholder="e.g., Shorter focus blocks, more frequent breaks..."
                                            rows={3}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 resize-none"
                                        />
                                    </div>
                                )}

                                <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasCaregiving}
                                        onChange={(e) => setHasCaregiving(e.target.checked)}
                                        className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="text-white">I have caregiving responsibilities</span>
                                </label>
                            </motion.div>
                        )}

                        {/* Step 6: AI Preferences */}
                        {step === 6 && (
                            <motion.div
                                key="step-6"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-gray-400 mb-4">How would you like me to communicate with you?</p>

                                <div className="space-y-4">
                                    {/* AI Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Name your AI assistant</label>
                                        <input
                                            type="text"
                                            value={aiName}
                                            onChange={(e) => setAiName(e.target.value)}
                                            placeholder="e.g., Jarvis, Atlas, Focus..."
                                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">This is how your AI assistant will introduce itself</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-3">Personality Style</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {AI_PERSONALITIES.map((p) => (
                                                <button
                                                    key={p.value}
                                                    onClick={() => setAiPersonality(p.value)}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                                        aiPersonality === p.value
                                                            ? 'bg-blue-500/20 border-blue-500/50'
                                                            : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                                    }`}
                                                >
                                                    <p.icon size={20} className={aiPersonality === p.value ? 'text-blue-400' : 'text-gray-400'} />
                                                    <div className="text-left">
                                                        <div className="text-white font-medium">{p.label}</div>
                                                        <div className="text-xs text-gray-400">{p.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-3">Reminder Style</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {REMINDER_STYLES.map((r) => (
                                                <button
                                                    key={r.value}
                                                    onClick={() => setReminderStyle(r.value)}
                                                    className={`p-3 rounded-xl border transition-all text-left ${
                                                        reminderStyle === r.value
                                                            ? 'bg-blue-500/20 border-blue-500/50'
                                                            : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                                    }`}
                                                >
                                                    <div className="text-white font-medium text-sm">{r.label}</div>
                                                    <div className="text-xs text-gray-400">{r.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={wantsAccountability}
                                                onChange={(e) => setWantsAccountability(e.target.checked)}
                                                className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500"
                                            />
                                            <div>
                                                <span className="text-white">Hold me accountable</span>
                                                <p className="text-xs text-gray-400">Check in on my progress</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={wantsSuggestions}
                                                onChange={(e) => setWantsSuggestions(e.target.checked)}
                                                className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500"
                                            />
                                            <div>
                                                <span className="text-white">Give proactive suggestions</span>
                                                <p className="text-xs text-gray-400">Recommend improvements</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={wantsInsights}
                                                onChange={(e) => setWantsInsights(e.target.checked)}
                                                className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500"
                                            />
                                            <div>
                                                <span className="text-white">Share insights about my patterns</span>
                                                <p className="text-xs text-gray-400">Help me understand trends</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 7: Complete */}
                        {step === 7 && (
                            <motion.div
                                key="step-7"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center py-8"
                            >
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                    <Check size={48} className="text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">You&apos;re all set{displayName ? `, ${displayName}` : ''}!</h3>
                                <p className="text-gray-400 max-w-md mx-auto mb-6">
                                    I now have a better understanding of how you work. I&apos;ll use this to provide personalized guidance.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
                    <button
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={18} />
                        Back
                    </button>

                    {step < 7 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium"
                        >
                            Continue
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-green-500/20"
                        >
                            {isSaving ? 'Saving...' : 'Get Started'}
                            <Sparkles size={18} />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}


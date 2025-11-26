'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AIContextType {
    aiName: string
    setAiName: (name: string) => void
    isLoading: boolean
    refreshAIName: () => Promise<void>
}

const AIContext = createContext<AIContextType>({
    aiName: 'AI',
    setAiName: () => {},
    isLoading: true,
    refreshAIName: async () => {},
})

export function AIProvider({ children }: { children: ReactNode }) {
    const supabase = createClient()
    const [aiName, setAiName] = useState('AI')
    const [isLoading, setIsLoading] = useState(true)

    const fetchAIName = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setIsLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('ai_name')
                .eq('user_id', user.id)
                .single()

            if (profile?.ai_name) {
                setAiName(profile.ai_name)
            }
        } catch (error) {
            console.error('Error fetching AI name:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAIName()

        // Listen for profile updates
        const channel = supabase
            .channel('ai-name-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_profiles',
                },
                (payload) => {
                    if (payload.new.ai_name) {
                        setAiName(payload.new.ai_name)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <AIContext.Provider value={{ 
            aiName, 
            setAiName, 
            isLoading,
            refreshAIName: fetchAIName 
        }}>
            {children}
        </AIContext.Provider>
    )
}

export function useAI() {
    const context = useContext(AIContext)
    if (!context) {
        throw new Error('useAI must be used within an AIProvider')
    }
    return context
}


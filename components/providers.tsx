'use client'

import { ReactNode } from 'react'
import { AIProvider } from '@/contexts/ai-context'

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AIProvider>
            {children}
        </AIProvider>
    )
}




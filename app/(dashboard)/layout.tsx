import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/bottom-nav'
import DesktopNav from '@/components/desktop-nav'
import AppHeader from '@/components/app-header'
import PomodoroTimer from '@/components/pomodoro-timer'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen">
            {/* Desktop Sidebar Navigation */}
            <DesktopNav />
            
            {/* Main Content Area */}
            <div className="lg:ml-64">
                {/* App Header */}
                <AppHeader />
                
                {/* Page Content */}
                <div className="pb-24 lg:pb-8">
                    {children}
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />

            {/* Pomodoro Timer */}
            <PomodoroTimer />
        </div>
    )
}

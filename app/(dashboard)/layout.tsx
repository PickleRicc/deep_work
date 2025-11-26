import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/bottom-nav'
import DesktopNav from '@/components/desktop-nav'
import AppHeader from '@/components/app-header'
import AIChatPanel from '@/components/ai-chat-panel'
import NotificationScheduler from '@/components/notification-scheduler'
import { Providers } from '@/components/providers'

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
        <Providers>
            <div className="min-h-screen">
                {/* Desktop Sidebar Navigation */}
                <DesktopNav />
                
                {/* Main Content Area */}
                <div className="lg:ml-64">
                    {/* App Header */}
                    <AppHeader />
                    
                    {/* Page Content - Extra padding for iOS dock */}
                    <div className="pb-28 lg:pb-8" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
                        {children}
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <BottomNav />

                {/* AI Chat Panel */}
                <AIChatPanel />

                {/* Background notification scheduler */}
                <NotificationScheduler />
            </div>
        </Providers>
    )
}

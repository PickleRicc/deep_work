import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { subscription } = await request.json()

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Save subscription to user profile
        const { error } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: user.id,
                push_subscription: subscription,
                notifications_enabled: true,
            }, {
                onConflict: 'user_id',
            })

        if (error) {
            console.error('Error saving subscription:', error)
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Subscription error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Remove subscription
        const { error } = await supabase
            .from('user_profiles')
            .update({
                push_subscription: null,
                notifications_enabled: false,
            })
            .eq('user_id', user.id)

        if (error) {
            console.error('Error removing subscription:', error)
            return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unsubscribe error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


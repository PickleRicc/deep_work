import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        // Fetch the user's profile
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error) {
            return NextResponse.json({ 
                error: error.message, 
                code: error.code,
                details: error.details,
                hint: error.hint,
                user_id: user.id 
            }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true,
            user_id: user.id,
            profile: profile,
            intake_completed: profile?.intake_completed,
            ai_name: profile?.ai_name,
            work_style: profile?.work_style,
            chronotype: profile?.chronotype
        })
    } catch (error: any) {
        return NextResponse.json({ 
            error: error.message || 'Unknown error',
            stack: error.stack 
        }, { status: 500 })
    }
}



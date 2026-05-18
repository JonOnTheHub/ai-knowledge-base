import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
    try {
        const { uploadId } = await req.json()
        if (!uploadId) return NextResponse.json({ error: 'No uploadId provided' }, { status: 400 })

        const { error } = await supabase.from('documents').delete().eq('upload_id', uploadId)
        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[delete]', err)
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
}
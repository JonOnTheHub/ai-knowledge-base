import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { uploadId, filename } = await req.json()
    if (!uploadId) return NextResponse.json({ error: 'No uploadId provided' }, { status: 400 })

    let query = supabase.from('documents').delete().eq('upload_id', uploadId)
    if (filename) query = query.eq('filename', filename)

    const { error } = await query
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[delete]', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    try {
        const uploadId = req.nextUrl.searchParams.get('uploadId')
        if (!uploadId) return NextResponse.json({ error: 'No uploadId provided' }, { status: 400 })

        const { data, error } = await supabase
            .from('documents')
            .select('filename, chunk_index')
            .eq('upload_id', uploadId)

        if (error) throw error

        // Group by filename, count chunks per file
        const fileMap = new Map<string, number>()
        for (const row of data ?? []) {
            fileMap.set(row.filename, (fileMap.get(row.filename) ?? 0) + 1)
        }

        const files = Array.from(fileMap.entries()).map(([filename, chunks]) => ({ filename, chunks }))

        return NextResponse.json({ exists: files.length > 0, files })
    } catch (err) {
        console.error('[session]', err)
        return NextResponse.json({ error: 'Failed to load session' }, { status: 500 })
    }
}
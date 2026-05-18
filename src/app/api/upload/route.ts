import { NextRequest, NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import { chunkText } from '@/lib/chunker'
import { embedBatch } from '@/lib/embeddings'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

const BATCH_SIZE = 500

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF only' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 413 })

    const buffer = new Uint8Array(await file.arrayBuffer())
    const { text } = await extractText(buffer, { mergePages: true })
    const rawText = Array.isArray(text) ? text.join(' ') : text

    if (!rawText?.trim()) return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 422 })

    const chunks = chunkText(rawText)
    const embeddings = await embedBatch(chunks)
    const uploadId = randomUUID()

    const rows = chunks.map((chunk, i) => ({
      filename: file.name,
      chunk_text: chunk,
      embedding: embeddings[i],
      chunk_index: i,
      upload_id: uploadId,
    }))

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('documents').insert(batch)
      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunks: chunks.length,
      uploadId,
    })

  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
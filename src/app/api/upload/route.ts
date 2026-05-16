import { NextRequest, NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import { chunkText } from '@/lib/chunker'
import { embedBatch } from '@/lib/embeddings'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF only' }, { status: 400 })

    const buffer = new Uint8Array(await file.arrayBuffer())
    const { text } = await extractText(buffer, { mergePages: true })
    const rawText = Array.isArray(text) ? text.join(' ') : text

    if (!rawText?.trim()) return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 422 })

    const chunks = chunkText(rawText)
    const embeddings = await embedBatch(chunks)

    const rows = chunks.map((chunk, i) => ({
      filename: file.name,
      chunk_text: chunk,
      embedding: embeddings[i],
      chunk_index: i,
    }))

    const { error } = await supabase.from('documents').insert(rows)
    if (error) throw error

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunks: chunks.length,
    })

  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
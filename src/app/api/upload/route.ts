import { NextRequest, NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import mammoth from 'mammoth'
import { chunkText } from '@/lib/chunker'
import { embedBatch } from '@/lib/embeddings'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

const BATCH_SIZE = 500
const MAX_COMBINED_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

async function extractFileText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()

  if (file.type === 'application/pdf') {
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
    return Array.isArray(text) ? text.join(' ') : text
  }

  // DOCX
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
  return result.value
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const existingUploadId = formData.get('uploadId') as string | null
    const existingSize = Number(formData.get('currentSize') ?? 0)

    if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 })

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `${file.name} must be a PDF or DOCX` }, { status: 400 })
      }
    }

    const incomingSize = files.reduce((sum, f) => sum + f.size, 0)
    if (existingSize + incomingSize > MAX_COMBINED_SIZE) {
      return NextResponse.json({ error: 'Combined size exceeds 10MB limit' }, { status: 413 })
    }

    const uploadId = existingUploadId || randomUUID()
    const results: { filename: string; chunks: number }[] = []
    let totalChunks = 0

    for (const file of files) {
      const rawText = await extractFileText(file)

      if (!rawText?.trim()) {
        return NextResponse.json({ error: `Could not extract text from ${file.name}` }, { status: 422 })
      }

      const chunks = chunkText(rawText)
      const embeddings = await embedBatch(chunks)

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

      results.push({ filename: file.name, chunks: chunks.length })
      totalChunks += chunks.length
    }

    return NextResponse.json({
      success: true,
      uploadId,
      files: results,
      totalChunks,
      totalSize: existingSize + incomingSize,
    })

  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
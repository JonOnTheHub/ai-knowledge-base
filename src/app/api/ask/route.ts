import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { embedText } from '@/lib/embeddings'
import { supabase } from '@/lib/supabase'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const { question } = await req.json()

        if (!question?.trim()) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

        // Embed the question
        const queryEmbedding = await embedText(question)

        // Vector similarity search
        const { data: chunks, error } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_count: 5,
        })

        if (error) throw error
        if (!chunks?.length) return NextResponse.json({ error: 'No relevant content found' }, { status: 404 })

        // Build context from top chunks
        const context = chunks
            .map((c: { chunk_text: string; chunk_index: number }, i: number) => `[Chunk ${i + 1}]:\n${c.chunk_text}`)
            .join('\n\n')

        // Groq completion
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a precise knowledge base assistant. Answer questions using ONLY the context provided. 
If the answer is not in the context, say so clearly. Do not hallucinate.`,
                },
                {
                    role: 'user',
                    content: `Context:\n${context}\n\nQuestion: ${question}`,
                },
            ],
            temperature: 0.2,
        })

        const answer = completion.choices[0].message.content

        return NextResponse.json({
            answer,
            sources: chunks.map((c: { chunk_text: string; filename: string; chunk_index: number; similarity: number }) => ({
                chunk_text: c.chunk_text,
                filename: c.filename,
                chunk_index: c.chunk_index,
                similarity: c.similarity,
            })),
        })

    } catch (err) {
        console.error('[ask]', err)
        return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }
}
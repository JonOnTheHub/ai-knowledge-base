import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { embedText } from '@/lib/embeddings'
import { supabase } from '@/lib/supabase'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const { question, uploadId } = await req.json()


        if (!question?.trim()) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

        const queryEmbedding = await embedText(question)

        const { data: chunks, error } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_count: 5,
            filter_upload_id: uploadId ?? null,
        })

        if (error) throw error

        // No chunks — still answer, just say so
        if (!chunks?.length) {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful knowledge base assistant. No relevant content was found in the document for this question. Let the user know clearly but conversationally, and suggest they try rephrasing.`,
                    },
                    { role: 'user', content: question },
                ],
                temperature: 0.3,
            })

            return NextResponse.json({
                answer: completion.choices[0].message.content,
                sources: [],
            })
        }

        const context = chunks
            .map((c: { chunk_text: string }, i: number) => `[Chunk ${i + 1}]:\n${c.chunk_text}`)
            .join('\n\n')

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful, conversational assistant answering questions about an uploaded document.

Rules:
- Answer naturally and directly, like a knowledgeable human assistant would
- Base your answer on the context provided
- If the answer isn't explicitly in the context but you can reasonably infer it, say so briefly
- If something is genuinely not mentioned, say so conversationally — don't just say "not in context"
- Keep answers concise unless detail is needed
- Never mention "chunks", "context", or internal mechanics`,
                },
                {
                    role: 'user',
                    content: `Document context:\n${context}\n\nQuestion: ${question}`,
                },
            ],
            temperature: 0.3,
        })

        return NextResponse.json({
            answer: completion.choices[0].message.content,
            sources: chunks.map((c: { chunk_text: string; filename: string; chunk_index: number; similarity: number }) => ({
                chunk_text: c.chunk_text,
                filename: c.filename,
                chunk_index: c.chunk_index,
                similarity: c.similarity,
            })),
        })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Query failed'
        console.error('[ask]', { message, details: err instanceof Error ? err.stack : '', hint: '', code: '' })
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
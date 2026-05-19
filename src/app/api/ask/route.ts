import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { embedText } from '@/lib/embeddings'
import { supabase } from '@/lib/supabase'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const { question, uploadId, history } = await req.json()

        if (!question?.trim()) {
            return new Response(JSON.stringify({ error: 'No question provided' }), { status: 400 })
        }

        const queryEmbedding = await embedText(question)

        const { data: chunks, error } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_count: 5,
            filter_upload_id: uploadId ?? null,
        })

        if (error) throw error

        const sources = chunks?.map((c: { chunk_text: string; filename: string; chunk_index: number; similarity: number }) => ({
            chunk_text: c.chunk_text,
            filename: c.filename,
            chunk_index: c.chunk_index,
            similarity: c.similarity,
        })) ?? []

        const context = chunks?.length
            ? chunks.map((c: { chunk_text: string }, i: number) => `[Chunk ${i + 1}]:\n${c.chunk_text}`).join('\n\n')
            : null

        // Build message history for the LLM
        const priorMessages = (history ?? []).map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        }))

        const systemPrompt = context
            ? `You are a helpful, conversational assistant answering questions about an uploaded document.

Rules:
- Answer naturally and directly
- Base your answer on the context provided
- If the answer isn't explicitly in the context but you can reasonably infer it, say so briefly
- If something is genuinely not mentioned, say so conversationally
- Keep answers concise unless detail is needed
- Never mention "chunks", "context", or internal mechanics

Document context:
${context}`
            : `You are a helpful knowledge base assistant. No relevant content was found in the document for this question. Let the user know clearly but conversationally, and suggest they try rephrasing.`

        const stream = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...priorMessages,
                { role: 'user', content: question },
            ],
            temperature: 0.3,
            stream: true,
        })

        // Stream the response with sources in the first chunk
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller) {
                // Send sources first as a metadata chunk
                controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ type: 'sources', sources })}\n\n`
                ))

                for await (const chunk of stream) {
                    const delta = chunk.choices[0]?.delta?.content
                    if (delta) {
                        controller.enqueue(encoder.encode(
                            `data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`
                        ))
                    }
                }

                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
            },
        })

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        })

    } catch (err) {
        console.error('[ask]', err)
        return new Response(JSON.stringify({ error: 'Query failed' }), { status: 500 })
    }
}
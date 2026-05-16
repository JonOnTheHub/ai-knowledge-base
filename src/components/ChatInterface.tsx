'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, CircleNotch } from '@phosphor-icons/react'
import SourceChunks from './SourceChunks'

interface Source {
    chunk_text: string
    filename: string
    chunk_index: number
    similarity: number
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    sources?: Source[]
}

export default function ChatInterface({ enabled }: { enabled: boolean }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const autoResize = () => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
    }

    const ask = async () => {
        const question = input.trim()
        if (!question || loading || !enabled) return

        setInput('')
        setError(null)
        if (textareaRef.current) textareaRef.current.style.height = 'auto'

        setMessages(prev => [...prev, { role: 'user', content: question }])
        setLoading(true)

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Query failed')

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
            }])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-zinc-300">
                            {enabled ? 'Ask anything about your document' : 'Upload a PDF to get started'}
                        </p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role === 'user' ? (
                            <div className="bg-zinc-900 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%]">
                                {msg.content}
                            </div>
                        ) : (
                            <div className="w-full">
                                <p className="text-sm text-zinc-700 leading-relaxed">{msg.content}</p>
                                {msg.sources && msg.sources.length > 0 && (
                                    <SourceChunks chunks={msg.sources} />
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex items-start gap-2">
                        <CircleNotch size={14} className="text-zinc-300 animate-spin mt-1" />
                        <span className="text-xs text-zinc-300">Searching knowledge base</span>
                    </div>
                )}

                {error && (
                    <p className="text-xs text-red-400 pl-1">{error}</p>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={`border border-zinc-200 rounded-xl overflow-hidden transition-opacity ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => { setInput(e.target.value); autoResize() }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
                    placeholder="Ask a question..."
                    rows={1}
                    className="w-full px-4 pt-3 pb-2 text-sm text-zinc-800 placeholder:text-zinc-300 resize-none outline-none bg-white"
                />
                <div className="flex justify-end px-3 pb-2.5">
                    <button
                        onClick={ask}
                        disabled={!input.trim() || loading}
                        className="bg-zinc-900 text-white rounded-lg p-1.5 disabled:opacity-30 hover:bg-zinc-700 active:scale-95 transition-all"
                    >
                        <ArrowUp size={14} weight="bold" />
                    </button>
                </div>
            </div>

        </div>
    )
}

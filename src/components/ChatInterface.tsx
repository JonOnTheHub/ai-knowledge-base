'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, CircleNotch } from '@phosphor-icons/react'
import SourceChunks from './SourceChunks'
import ReactMarkdown from 'react-markdown'

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

export default function ChatInterface({ enabled, uploadId }: { enabled: boolean; uploadId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const autoResize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }

  const ask = async () => {
    const question = input.trim()
    if (!question || streaming || !enabled) return

    setInput('')
    setError(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Build history from current messages (exclude last assistant if streaming)
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    const userMessage: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setStreaming(true)

    // Placeholder assistant message we'll stream into
    const assistantMessage: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMessage])

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, uploadId, history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error('Query failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No stream')

      let buffer = ''
      let sources: Source[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'sources') {
              sources = parsed.sources
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...updated[updated.length - 1], sources }
                return updated
              })
            }

            if (parsed.type === 'delta') {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + parsed.content,
                }
                return updated
              })
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          } catch {
            // malformed chunk, skip
          }
        }
      }

    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError('Query failed. Try again.')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-700">
              {enabled ? 'Ask anything about your document' : 'Upload a PDF to get started'}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'user' ? (
              <div className="text-zinc-100 text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed"
                style={{ background: '#00A36C22', border: '1px solid #00A36C44' }}>
                {msg.content}
              </div>
            ) : (
              <div className="w-full">
                <div className="text-xs text-zinc-300 leading-relaxed prose prose-invert prose-xs max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-ol:my-1 prose-headings:text-zinc-200 prose-strong:text-zinc-200">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {streaming && i === messages.length - 1 && (
                    <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#00A36C] align-middle animate-[blink_1s_ease-in-out_infinite]" />
                  )}
                </div>
                {msg.sources && msg.sources.length > 0 && !streaming && (
                  <SourceChunks chunks={msg.sources} />
                )}
              </div>
            )}
          </div>
        ))}

        {error && <p className="text-[11px] text-red-500 pl-1">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`border border-zinc-800 rounded-xl overflow-hidden bg-[#1c1c1f] transition-opacity ${!enabled ? 'opacity-30 pointer-events-none' : ''}`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); autoResize() }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
          placeholder="Ask a question..."
          rows={1}
          className="w-full px-4 pt-3 pb-2 text-xs text-zinc-200 placeholder:text-zinc-700 resize-none outline-none bg-transparent"
        />
        <div className="flex justify-end px-3 pb-2.5">
          <button
            onClick={ask}
            disabled={!input.trim() || streaming}
            className="rounded-lg p-1.5 disabled:opacity-20 active:scale-95 transition-all"
            style={{ background: '#00A36C' }}
          >
            {streaming
              ? <CircleNotch size={12} className="text-white animate-spin" />
              : <ArrowUp size={12} weight="bold" className="text-white" />
            }
          </button>
        </div>
      </div>

    </div>
  )
}
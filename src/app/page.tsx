'use client'

import { useState } from 'react'
import UploadZone from '@/components/UploadZone'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  const [indexed, setIndexed] = useState<{ filename: string; chunks: number; uploadId: string } | null>(null)
  const [resetKey, setResetKey] = useState(0)

  const handleReset = () => {
    setIndexed(null)
    setResetKey(k => k + 1)
  }

  return (
    <main className="min-h-dvh bg-[#111112] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 md:gap-6 md:items-start">

        <div className="flex flex-col gap-7">
          <div className="border-l-2 border-zinc-700 pl-4">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Knowledge Base</h1>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Drop a PDF. Query it with natural language. MVP</p>
          </div>

          <UploadZone
            onUploadComplete={(filename, chunks, uploadId) => setIndexed({ filename, chunks, uploadId })}
            onReset={handleReset}
            uploadId={indexed?.uploadId ?? null}
          />

          {indexed && (
            <div className="border-t border-zinc-800 pt-5 space-y-2.5">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">Indexed</p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">File</span>
                  <span className="text-xs text-zinc-300 font-medium truncate max-w-40">{indexed.filename}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Chunks</span>
                  <span className="text-xs text-zinc-300 font-medium tabular-nums">{indexed.chunks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Embeddings</span>
                  <span className="text-xs text-zinc-300 font-medium">voyage-3-lite</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Search</span>
                  <span className="text-xs text-zinc-300 font-medium">cosine · pgvector</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">LLM</span>
                  <span className="text-xs text-zinc-300 font-medium">llama-3.3-70b · Groq</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative bg-[#18181b] border border-zinc-800 rounded-2xl p-5 md:p-6 h-150 flex flex-col">
          <ChatInterface key={resetKey} enabled={!!indexed} uploadId={indexed?.uploadId ?? null} />
        </div>

      </div>
    </main>
  )
}
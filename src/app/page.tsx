'use client'

import { useState } from 'react'
import UploadZone from '@/components/UploadZone'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  const [indexed, setIndexed] = useState<{ filename: string; chunks: number } | null>(null)

  return (
    <main className="min-h-dvh bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 md:gap-8 md:items-start">

        {/* Left — Upload + info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Knowledge Base</h1>
            <p className="text-sm text-zinc-400 mt-1">Upload a PDF. Ask anything about it.</p>
          </div>

          <UploadZone
            onUploadComplete={(filename, chunks) => setIndexed({ filename, chunks })}
          />

          {indexed && (
            <div className="text-xs text-zinc-400 space-y-1 pl-1">
              <p><span className="text-zinc-600 font-medium">File:</span> {indexed.filename}</p>
              <p><span className="text-zinc-600 font-medium">Chunks:</span> {indexed.chunks} indexed</p>
              <p><span className="text-zinc-600 font-medium">Model:</span> text-embedding-3-small</p>
              <p><span className="text-zinc-600 font-medium">Search:</span> cosine similarity via pgvector</p>
            </div>
          )}
        </div>

        {/* Right — Chat */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 h-[600px] flex flex-col">
          <ChatInterface enabled={!!indexed} />
        </div>

      </div>
    </main>
  )
}
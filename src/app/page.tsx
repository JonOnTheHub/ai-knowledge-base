'use client'

import { useState } from 'react'
import UploadZone from '@/components/UploadZone'
import ChatInterface from '@/components/ChatInterface'

interface IndexedFile {
  filename: string
  chunks: number
}

export default function Home() {
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [files, setFiles] = useState<IndexedFile[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [resetKey, setResetKey] = useState(0)

  const handleUpdate = (id: string | null, newFiles: IndexedFile[], size: number) => {
    setUploadId(id)
    setFiles(newFiles)
    setTotalSize(size)
    if (!id) setResetKey(k => k + 1)
  }

  const totalChunks = files.reduce((sum, f) => sum + f.chunks, 0)

  return (
    <main className="min-h-dvh bg-[#111112] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 md:gap-6 md:items-stretch max-h-[85dvh]">

        {/* Left panel */}
        <div className="flex flex-col gap-7 overflow-y-auto md:max-h-[85dvh] pr-1">
          <div className="border-l-2 border-zinc-700 pl-4 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Paper Base</h1>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Drop PDFs. Query across all of them.</p>
          </div>

          <UploadZone
            onUpdate={handleUpdate}
            uploadId={uploadId}
            currentSize={totalSize}
            files={files}
          />

          {files.length > 0 && (
            <div className="border-t border-zinc-800 pt-5 space-y-2.5 shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">Session</p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Files</span>
                  <span className="text-xs text-zinc-300 font-medium">{files.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Total chunks</span>
                  <span className="text-xs text-zinc-300 font-medium tabular-nums">{totalChunks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Embeddings</span>
                  <span className="text-xs text-zinc-300 font-medium">voyage-3-lite</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">LLM</span>
                  <span className="text-xs text-zinc-300 font-medium">llama-3.3-70b · Groq</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — chat, matches left panel height, scrolls internally */}
        <div className="relative bg-[#18181b] border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col min-h-[420px] md:min-h-0 md:max-h-[85dvh]">
          <ChatInterface key={resetKey} enabled={files.length > 0} uploadId={uploadId} />
        </div>

      </div>
    </main>
  )
}
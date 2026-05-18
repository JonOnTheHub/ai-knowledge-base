'use client'

import { useState, useRef, DragEvent } from 'react'
import { CloudArrowUp, FilePdf, X, CheckCircle } from '@phosphor-icons/react'

interface UploadZoneProps {
  onUploadComplete: (filename: string, chunks: number, uploadId: string) => void
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ filename: string; chunks: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    if (f.type !== 'application/pdf') { setError('PDF files only'); return }

    setFile(f)
    setError(null)
    setState('uploading')

    const formData = new FormData()
    formData.append('file', f)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setProgress({ filename: data.filename, chunks: data.chunks })
      setState('success')
      onUploadComplete(data.filename, data.chunks, data.uploadId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setState('error')
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const reset = () => {
    setState('idle')
    setFile(null)
    setError(null)
    setProgress(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="w-full">
      {state === 'success' && progress ? (
        <div className="border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-4 bg-[#1c1c1f]">
          <div className="flex items-start gap-3">
            <CheckCircle weight="fill" className="text-emerald-500 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs font-medium text-zinc-200">{progress.filename}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{progress.chunks} chunks indexed</p>
            </div>
          </div>
          <button onClick={reset} className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`
            relative border border-dashed rounded-xl p-8 cursor-pointer
            flex flex-col items-center justify-center gap-3 text-center
            transition-all duration-200 select-none
            ${dragging
              ? 'border-zinc-600 bg-zinc-800/30'
              : 'border-zinc-800 bg-[#1c1c1f] hover:border-zinc-700 hover:bg-zinc-800/20'
            }
            ${state === 'uploading' ? 'pointer-events-none' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {state === 'uploading' ? (
            <>
              <div className="flex items-center gap-2">
                <FilePdf size={16} className="text-zinc-500" />
                <span className="text-xs text-zinc-500 truncate max-w-45">{file?.name}</span>
              </div>
              <div className="w-40 h-px bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-500 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" style={{ width: '60%' }} />
              </div>
              <p className="text-[11px] text-zinc-600">Extracting · Chunking · Embedding</p>
            </>
          ) : (
            <>
              <CloudArrowUp
                size={28}
                weight="thin"
                className={`transition-colors ${dragging ? 'text-zinc-400' : 'text-zinc-700'}`}
              />
              <div>
                <p className="text-xs font-medium text-zinc-400">
                  {dragging ? 'Drop it' : 'Drop a PDF or click to browse'}
                </p>
                <p className="text-[11px] text-zinc-600 mt-1">Max 10MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {state === 'error' && error && (
        <p className="text-[11px] text-red-500 mt-2 pl-1">{error}</p>
      )}
    </div>
  )
}
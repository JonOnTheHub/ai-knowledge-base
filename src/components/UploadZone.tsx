'use client'

import { useState, useRef, DragEvent } from 'react'
import { CloudArrowUp, FilePdf, X, CheckCircle } from '@phosphor-icons/react'

interface UploadZoneProps {
    onUploadComplete: (filename: string, chunks: number) => void
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
        if (f.type !== 'application/pdf') {
            setError('PDF files only')
            return
        }

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
            onUploadComplete(data.filename, data.chunks)
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
                <div className="border border-zinc-200 rounded-xl p-5 flex items-start justify-between gap-4 bg-white">
                    <div className="flex items-start gap-3">
                        <CheckCircle weight="fill" className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                        <div>
                            <p className="text-sm font-medium text-zinc-800">{progress.filename}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{progress.chunks} chunks indexed</p>
                        </div>
                    </div>
                    <button
                        onClick={reset}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={`
            relative border-2 border-dashed rounded-xl p-10 cursor-pointer
            flex flex-col items-center justify-center gap-3 text-center
            transition-all duration-200 select-none
            ${dragging
                            ? 'border-emerald-400 bg-emerald-50/50'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
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
                                <FilePdf size={20} className="text-zinc-400" />
                                <span className="text-sm text-zinc-500 truncate max-w-[200px]">{file?.name}</span>
                            </div>
                            <div className="w-48 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                            </div>
                            <p className="text-xs text-zinc-400">Extracting · Chunking · Embedding</p>
                        </>
                    ) : (
                        <>
                            <CloudArrowUp
                                size={32}
                                weight="thin"
                                className={`transition-colors ${dragging ? 'text-emerald-500' : 'text-zinc-300'}`}
                            />
                            <div>
                                <p className="text-sm font-medium text-zinc-700">
                                    {dragging ? 'Drop it' : 'Drop a PDF or click to browse'}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">Extracts, chunks, and indexes automatically</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {state === 'error' && error && (
                <p className="text-xs text-red-500 mt-2 pl-1">{error}</p>
            )}
        </div>
    )
}
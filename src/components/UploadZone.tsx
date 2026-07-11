'use client'

import { useState, useRef, DragEvent } from 'react'
import { CloudArrowUp, FilePdf, X, CheckCircle } from '@phosphor-icons/react'

interface IndexedFile {
    filename: string
    chunks: number
}

interface UploadZoneProps {
    onUpdate: (uploadId: string | null, files: IndexedFile[], totalSize: number) => void
    uploadId: string | null
    currentSize: number
    files: IndexedFile[]
}

type UploadState = 'idle' | 'uploading' | 'error'

const MAX_COMBINED_SIZE = 10 * 1024 * 1024

export default function UploadZone({ onUpdate, uploadId, currentSize, files }: UploadZoneProps) {
    const [state, setState] = useState<UploadState>('idle')
    const [dragging, setDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const remaining = MAX_COMBINED_SIZE - currentSize
    const remainingMB = (remaining / (1024 * 1024)).toFixed(1)

    const handleFiles = async (fileList: FileList) => {
        const incoming = Array.from(fileList)
        const nonPdf = incoming.find(f => f.type !== 'application/pdf')
        if (nonPdf) { setError(`${nonPdf.name} is not a PDF`); return }

        const incomingSize = incoming.reduce((sum, f) => sum + f.size, 0)
        if (currentSize + incomingSize > MAX_COMBINED_SIZE) {
            setError(`Exceeds combined 10MB limit — ${remainingMB}MB remaining`)
            return
        }

        setError(null)
        setState('uploading')

        const formData = new FormData()
        incoming.forEach(f => formData.append('files', f))
        if (uploadId) formData.append('uploadId', uploadId)
        formData.append('currentSize', String(currentSize))

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Upload failed')

            const newFiles = [...files, ...data.files]
            onUpdate(data.uploadId, newFiles, data.totalSize)
            setState('idle')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
            setState('error')
        }
    }

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
    }

    const removeFile = async (filename: string) => {
        if (!uploadId) return
        try {
            await fetch('/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uploadId, filename }),
            })
            const remainingFiles = files.filter(f => f.filename !== filename)
            // Recompute size client-side isn't exact without original file sizes,
            // so we just refetch nothing — trust server truth on next upload check.
            // Simplify: if no files left, fully reset session.
            if (remainingFiles.length === 0) {
                onUpdate(null, [], 0)
            } else {
                onUpdate(uploadId, remainingFiles, currentSize) // size correction happens server-side on next add
            }
        } catch (err) {
            console.error('[remove]', err)
        }
    }

    const resetAll = async () => {
        if (uploadId) {
            try {
                await fetch('/api/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uploadId }),
                })
            } catch (err) {
                console.error('[reset]', err)
            }
        }
        onUpdate(null, [], 0)
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div className="w-full space-y-3">
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((f, i) => (
                        <div key={i} className="border border-zinc-800 rounded-xl p-3.5 flex items-start justify-between gap-3 bg-[#1c1c1f]">
                            <div className="flex items-start gap-2.5 min-w-0">
                                <CheckCircle weight="fill" className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-zinc-200 truncate">{f.filename}</p>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">{f.chunks} chunks</p>
                                </div>
                            </div>
                            <button onClick={() => removeFile(f.filename)} className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
                                <X size={13} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={resetAll}
                        className="text-[11px] text-zinc-600 hover:text-red-400 transition-colors pl-1"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {remaining > 0 && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={`
            relative border border-dashed rounded-xl p-6 cursor-pointer
            flex flex-col items-center justify-center gap-2 text-center
            transition-all duration-200 select-none
            ${dragging ? 'border-zinc-600 bg-zinc-800/30' : 'border-zinc-800 bg-[#1c1c1f] hover:border-zinc-700 hover:bg-zinc-800/20'}
            ${state === 'uploading' ? 'pointer-events-none' : ''}
          `}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files) }}
                    />

                    {state === 'uploading' ? (
                        <>
                            <div className="flex items-center gap-2">
                                <FilePdf size={16} className="text-zinc-500" />
                                <span className="text-xs text-zinc-500">Processing...</span>
                            </div>
                            <div className="w-40 h-px bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-zinc-500 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                            </div>
                        </>
                    ) : (
                        <>
                            <CloudArrowUp size={24} weight="thin" className={dragging ? 'text-zinc-400' : 'text-zinc-700'} />
                            <p className="text-xs font-medium text-zinc-400">
                                {files.length > 0 ? 'Add more PDFs' : 'Drop PDFs or click to browse'}
                            </p>
                            <p className="text-[11px] text-zinc-600">{remainingMB}MB remaining · combined limit 10MB</p>
                        </>
                    )}
                </div>
            )}

            {error && <p className="text-[11px] text-red-500 pl-1">{error}</p>}
        </div>
    )
}
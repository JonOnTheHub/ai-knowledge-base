'use client'

import { useState } from 'react'
import { X, ArrowUpRight } from '@phosphor-icons/react'

interface Chunk {
    chunk_text: string
    filename: string
    chunk_index: number
    similarity: number
}

export default function SourceChunks({ chunks }: { chunks: Chunk[] }) {
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Trigger pill */}
            <button
                onClick={() => setOpen(true)}
                className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors group"
            >
                <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span>{chunks.length} source{chunks.length > 1 ? 's' : ''}</span>
            </button>

            {/* Modal */}
            {open && (
                <div
                    className="absolute inset-0 z-50 rounded-2xl overflow-hidden"
                    onClick={() => setOpen(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-[#111112]/80 backdrop-blur-sm" />

                    {/* Panel */}
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-[#18181b] border-t border-zinc-800 rounded-t-2xl p-5 max-h-[70%] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <div>
                                <p className="text-xs font-medium text-zinc-200">Sources</p>
                                <p className="text-[11px] text-zinc-600 mt-0.5">{chunks.length} chunk{chunks.length > 1 ? 's' : ''} retrieved</p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-zinc-600 hover:text-zinc-400 transition-colors p-1"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Chunks */}
                        <div className="overflow-y-auto space-y-3 pr-1">
                            {chunks.map((chunk, i) => (
                                <div key={i} className="border border-zinc-800 rounded-xl p-3.5 bg-[#111112]">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                                                Chunk {chunk.chunk_index + 1}
                                            </span>
                                            <span className="text-[10px] text-zinc-700">·</span>
                                            <span className="text-[10px] text-zinc-600 truncate max-w-[140px]">{chunk.filename}</span>
                                        </div>
                                        <span
                                            className="text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded-md"
                                            style={{
                                                color: chunk.similarity > 0.6 ? '#00A36C' : '#71717a',
                                                background: chunk.similarity > 0.6 ? '#00A36C15' : '#27272a',
                                            }}
                                        >
                                            {(chunk.similarity * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 leading-relaxed">{chunk.chunk_text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
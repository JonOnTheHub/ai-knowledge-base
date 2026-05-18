interface Chunk {
    chunk_text: string
    filename: string
    chunk_index: number
    similarity: number
}

export default function SourceChunks({ chunks }: { chunks: Chunk[] }) {
    return (
        <div className="mt-3 space-y-2">
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Sources</p>
            {chunks.map((chunk, i) => (
                <div key={i} className="border-l border-zinc-800 pl-3 py-0.5">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-zinc-600">{chunk.filename} · chunk {chunk.chunk_index + 1}</span>
                        <span className="text-[11px] tabular-nums text-zinc-700">{(chunk.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-relaxed line-clamp-2">{chunk.chunk_text}</p>
                </div>
            ))}
        </div>
    )
}
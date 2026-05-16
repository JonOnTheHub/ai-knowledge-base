interface Chunk {
    chunk_text: string
    filename: string
    chunk_index: number
    similarity: number
}

export default function SourceChunks({ chunks }: { chunks: Chunk[] }) {
    return (
        <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Sources</p>
            {chunks.map((chunk, i) => (
                <div key={i} className="border-l-2 border-zinc-100 pl-3 py-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400">{chunk.filename} · chunk {chunk.chunk_index + 1}</span>
                        <span className="text-xs tabular-nums text-zinc-300">{(chunk.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{chunk.chunk_text}</p>
                </div>
            ))}
        </div>
    )
}
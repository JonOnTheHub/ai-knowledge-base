export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const words = text.split(/\s+/).filter(Boolean)
    const chunks: string[] = []

    let i = 0
    while (i < words.length) {
        const chunk = words.slice(i, i + chunkSize).join(' ')
        if (chunk.trim()) chunks.push(chunk)
        i += chunkSize - overlap
    }

    return chunks
}
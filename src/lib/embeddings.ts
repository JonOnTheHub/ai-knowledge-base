const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const MODEL = 'voyage-3-lite'
const EMBED_BATCH_SIZE = 64 

async function voyageEmbedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: texts, model: MODEL }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage embedding failed: ${err}`)
  }

  const data = await res.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}

async function voyageEmbed(texts: string[]): Promise<number[][]> {
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const slice = texts.slice(i, i + EMBED_BATCH_SIZE)
    const embeddings = await voyageEmbedBatch(slice)
    results.push(...embeddings)
  }

  return results
}

export async function embedText(text: string): Promise<number[]> {
  const result = await voyageEmbed([text])
  return result[0]
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  return voyageEmbed(texts)
}
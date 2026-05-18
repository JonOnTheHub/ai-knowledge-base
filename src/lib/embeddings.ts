import { pipeline, env, FeatureExtractionPipeline } from '@huggingface/transformers'

env.cacheDir = './.cache'

let embedder: FeatureExtractionPipeline | null = null

async function getEmbedder(): Promise<FeatureExtractionPipeline> {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5') as FeatureExtractionPipeline
    }
    return embedder
}

async function embed(texts: string[]): Promise<number[][]> {
    const extractor = await getEmbedder()
    const output = await extractor(texts, { pooling: 'mean', normalize: true })
    const tensor = output as { data: Float32Array; dims: number[] }
    const [batchSize, dims] = tensor.dims
    const result: number[][] = []
    for (let i = 0; i < batchSize; i++) {
        result.push(Array.from(tensor.data.slice(i * dims, (i + 1) * dims)))
    }
    return result
}

export async function embedText(text: string): Promise<number[]> {
    const result = await embed([text])
    return result[0]
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
    return embed(texts)
}
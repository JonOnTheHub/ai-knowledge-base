# PaperBase

Upload a PDF. Ask anything about it. Get answers grounded in the document with sources cited.

Built without LangChain — every layer of the RAG pipeline is hand-rolled.

🔗 **Live:** https://paper-base.vercel.app

## How It Works

1. Upload a PDF → text extracted and split into 500-word chunks (50-word overlap)
2. Each chunk converted into a vector via Voyage AI embeddings (512 dims)
3. Vectors stored in Supabase with pgvector
4. Ask a question → question vectorised the same way
5. Cosine similarity search retrieves the 5 most relevant chunks
6. Chunks + conversation history passed to Groq LLaMA 3.3 70b
7. Answer streamed token by token with source citations shown
8. On reset, all chunks deleted from Supabase — nothing persists

## Stack

- **Next.js 16** — App Router, API routes
- **Voyage AI** — `voyage-3-lite` embeddings, 512 dims
- **Supabase + pgvector** — vector storage, cosine similarity search
- **Groq** — LLaMA 3.3 70b, SSE streaming
- **TypeScript** throughout

## Features

- Streaming responses via SSE
- Conversation history — follow-up questions work
- Source citations with similarity scores
- Markdown formatted answers
- Per-upload isolation — queries scoped to active document only
- Automatic cleanup — chunks deleted from DB on session reset
- File guards — PDF only, 10MB max
- Retry logic with exponential backoff on embedding failures
- Batched inserts for large documents

## Local Setup

```bash
git clone https://github.com/JonOnTheHub/ai-knowledge-base
cd ai-knowledge-base
npm install
```

Create `.env.local`:

```env
GROQ_API_KEY=
VOYAGE_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Run the Supabase SQL in `/supabase/schema.sql`, then:

```bash
npm run dev
```

## What I Learned

Built as a learning project to understand RAG pipelines from first principles. Every component implemented manually — chunking strategy, embedding pipeline, vector search, SSE streaming, history management, and stream parsing. No LangChain, no abstractions hiding the plumbing.

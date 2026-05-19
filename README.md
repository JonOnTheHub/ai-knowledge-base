# AI Knowledge Base

Upload a PDF. Ask anything about it. Get answers grounded in the document with sources cited.

Built without LangChain — every layer of the RAG pipeline is hand-rolled.

## Live Demo
https://paper-base.vercel.app

## How It Works

1. Upload a PDF → text extracted, split into 500-word chunks (50-word overlap)
2. Each chunk embedded locally via `bge-small-en-v1.5` — no external embedding API
3. Vectors stored in Supabase with pgvector
4. Ask a question → question embedded the same way
5. Cosine similarity search retrieves the 5 most relevant chunks
6. Chunks + conversation history passed to Groq LLaMA 3.3 70b
7. Answer streamed token by token with source citations
8. On reset, all chunks deleted from Supabase — nothing persists

## Stack

- **Next.js 16** — App Router, API routes
- **@huggingface/transformers** — local embeddings, bge-small-en-v1.5, 384 dims
- **Supabase + pgvector** — vector storage, cosine similarity search
- **Groq** — LLaMA 3.3 70b, streaming responses
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

## Local Setup

```bash
git clone https://github.com/JonOnTheHub/ai-knowledge-base
cd ai-knowledge-base
npm install
```

Create `.env.local`:

```env
GROQ_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Run the Supabase SQL setup (see `/supabase/schema.sql`), then:

```bash
npm run dev
```

## Supabase Setup

Enable pgvector and run:

```sql
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  chunk_text text not null,
  embedding vector(384),
  chunk_index integer not null,
  upload_id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone default now()
);

create index on documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create or replace function match_documents(
  query_embedding vector(384),
  match_count int default 5,
  filter_upload_id uuid default null
)
returns table(
  id uuid,
  chunk_text text,
  filename text,
  chunk_index int,
  similarity float,
  upload_id uuid
)
language sql stable
as $$
  select id, chunk_text, filename, chunk_index,
    1 - (embedding <=> query_embedding) as similarity,
    upload_id
  from documents
  where filter_upload_id is null or upload_id = filter_upload_id
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

## What I Learned

built as a learning project to understand RAG pipelines from first principles — no LangChain or abstractions. Every component was implemented manually: chunking strategy, embedding pipeline, vector search, SSE streaming, history management, and stream parsing.
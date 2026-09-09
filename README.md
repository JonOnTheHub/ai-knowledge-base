# PaperBase

Turn your documents into a private AI assistant. Upload PDFs or Word docs, ask questions in plain language, get answers grounded in your own files — with sources cited, nothing hallucinated.

Built without LangChain. Every layer of the pipeline is hand-rolled.

🔗 **Live:** https://paper-base.vercel.app

---

## How It Works

1. Upload one or more PDFs/DOCX files (combined 10MB per knowledge base)
2. Text extracted, split into 500-word chunks with overlap for context continuity
3. Each chunk converted to a vector via Voyage AI embeddings
4. Vectors stored in Supabase with pgvector — permanently, tied to a unique link
5. Ask a question → question vectorised the same way
6. Cosine similarity search retrieves the most relevant chunks across all uploaded documents
7. Chunks + conversation history passed to Groq  llama-3.1-70b-specdec
8. Answer rendered word by word, with source chunks and similarity scores available on demand
9. Bookmark the link (`?kb=<id>`) to return to the same knowledge base anytime — nothing is lost on refresh

---

## What Makes This Different From "Just ChatGPT with a PDF"

- **Multi-document synthesis** — ask a question spanning multiple files, and it combines and attributes the answer across sources
- **Conflict detection** — if two documents disagree, it tells you, instead of silently picking one
- **Persistent, shareable knowledge bases** — no login, no re-uploading; the link is the access key
- **Nothing invented** — answers are grounded strictly in what you uploaded, not the model's training data

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 App Router |
| Embeddings | Voyage AI `voyage-3-lite` (512 dims) |
| Vector DB | Supabase + pgvector |
| LLM | Groq LLaMA 3.3 70b specdec | 
| Document parsing | `unpdf` (PDF), `mammoth` (DOCX) |
| Rendering | react-markdown + Tailwind typography |
| Language | TypeScript throughout |

---

## Features

- Multi-file upload (PDF + DOCX, mixed), combined 10MB cap
- Persistent sessions via shareable URL — survives refresh, revisit, sharing
- Multi-document synthesis with cross-document attribution
- Conflict detection between documents
- Conversation history — follow-up questions retain context
- Source citations with similarity scores, shown in a modal to keep answers clean
- Word-by-word rendered answers
- Per-file removal or full session clear, with actual deletion from the database
- File guards — type validation, combined size cap, empty-document detection
- Retry logic with exponential backoff on embedding failures
- Batched inserts for large documents

---

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

Run `/supabase/schema.sql` in your Supabase SQL editor, then:

```bash
npm run dev
```

---

## Who This Is For

Built for businesses sitting on document-heavy workflows — contracts, policies, case files, invoices, SOPs — where staff waste time re-reading the same files to answer routine questions. No enterprise RAG platform, no six-figure implementation. A private, working system in days.

---

## What I Learned

Built as a learning project to understand RAG pipelines from first principles, then extended into a real productized offer. Every component implemented manually — chunking, embedding, vector search, multi-document retrieval, prompt engineering for synthesis and conflict detection, persistent session architecture. No LangChain, no abstractions hiding the plumbing.
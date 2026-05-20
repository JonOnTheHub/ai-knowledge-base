drop table if exists documents;

create table documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  chunk_text text not null,
  embedding vector(512),
  chunk_index integer not null,
  upload_id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone default now()
);

create index on documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create or replace function match_documents(
  query_embedding vector(512),
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
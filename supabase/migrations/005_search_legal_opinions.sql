-- LexOrchestrator Migration 005: Enhanced Legal Opinion Search
-- Adds a filtered vector search function for legal_opinion_chunks.
-- Apply via Supabase Dashboard > SQL Editor after 004.

create or replace function match_legal_opinion_chunks(
  query_embedding      vector(1536),
  match_count          int     default 20,
  filter_jurisdiction  text    default null,
  filter_court         text    default null,
  filter_date_from     date    default null,
  filter_date_to       date    default null
)
returns table (
  id              uuid,
  opinion_id      uuid,
  chunk_index     integer,
  chunk_text      text,
  citation        text,
  court           text,
  jurisdiction    text,
  decision_date   date,
  page_start      integer,
  page_end        integer,
  span_start      integer,
  span_end        integer,
  case_name       text,
  metadata        jsonb,
  similarity      float
)
language plpgsql security invoker
as $$
begin
  return query
    select
      oc.id,
      oc.opinion_id,
      oc.chunk_index,
      oc.chunk_text,
      oc.citation,
      oc.court,
      oc.jurisdiction,
      oc.decision_date,
      oc.page_start,
      oc.page_end,
      oc.span_start,
      oc.span_end,
      lo.case_name,
      oc.metadata,
      (1 - (oc.embedding <=> query_embedding))::float as similarity
    from legal_opinion_chunks oc
    join legal_opinions lo on lo.id = oc.opinion_id
    where
      oc.embedding is not null
      and (filter_jurisdiction is null or oc.jurisdiction ilike '%' || filter_jurisdiction || '%')
      and (filter_court is null or oc.court ilike '%' || filter_court || '%')
      and (filter_date_from is null or oc.decision_date >= filter_date_from)
      and (filter_date_to is null or oc.decision_date <= filter_date_to)
    order by oc.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Full-text search function for keyword-based retrieval (no embedding required)
create or replace function search_legal_opinion_chunks_fulltext(
  search_query         text,
  match_count          int     default 20,
  filter_jurisdiction  text    default null,
  filter_court         text    default null,
  filter_date_from     date    default null,
  filter_date_to       date    default null
)
returns table (
  id              uuid,
  opinion_id      uuid,
  chunk_index     integer,
  chunk_text      text,
  citation        text,
  court           text,
  jurisdiction    text,
  decision_date   date,
  page_start      integer,
  page_end        integer,
  span_start      integer,
  span_end        integer,
  case_name       text,
  metadata        jsonb,
  rank            float
)
language plpgsql security invoker
as $$
begin
  return query
    select
      oc.id,
      oc.opinion_id,
      oc.chunk_index,
      oc.chunk_text,
      oc.citation,
      oc.court,
      oc.jurisdiction,
      oc.decision_date,
      oc.page_start,
      oc.page_end,
      oc.span_start,
      oc.span_end,
      lo.case_name,
      oc.metadata,
      ts_rank(to_tsvector('english', oc.chunk_text), plainto_tsquery('english', search_query))::float as rank
    from legal_opinion_chunks oc
    join legal_opinions lo on lo.id = oc.opinion_id
    where
      to_tsvector('english', oc.chunk_text) @@ plainto_tsquery('english', search_query)
      and (filter_jurisdiction is null or oc.jurisdiction ilike '%' || filter_jurisdiction || '%')
      and (filter_court is null or oc.court ilike '%' || filter_court || '%')
      and (filter_date_from is null or oc.decision_date >= filter_date_from)
      and (filter_date_to is null or oc.decision_date <= filter_date_to)
    order by rank desc
    limit match_count;
end;
$$;

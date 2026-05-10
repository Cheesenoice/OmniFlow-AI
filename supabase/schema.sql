-- ============================================================
-- OmniFlow AI — Supabase Database Schema
-- Uses: PostgreSQL 15 + pgvector extension
-- ============================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- TABLE: profiles
-- Stores user profile data and encrypted API keys.
-- Extends Supabase auth.users (managed schema).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  gemini_api_key TEXT,          -- encrypted at rest via pgcrypto / app layer
  openrouter_api_key TEXT,       -- optional: OpenRouter key for multi-model orchestration
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy: user can only read/update their own profile
CREATE POLICY "Users manage own profile"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- TABLE: contents
-- Every piece of generated content (blog, social post, docx export).
-- ============================================================
CREATE TYPE content_type AS ENUM ('blog', 'social_fb', 'social_ig', 'social_x', 'social_threads', 'youtube_script', 'docx_report');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'failed', 'archived');

CREATE TABLE IF NOT EXISTS public.contents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT,
  body            TEXT NOT NULL,
  content_type    content_type NOT NULL,
  status          content_status NOT NULL DEFAULT 'draft',
  source_idea     TEXT,           -- original user input / prompt
  source_file_url TEXT,           -- original uploaded .docx path in Supabase Storage
  platform_post_id TEXT,         -- remote post ID after publishing (tweet id, etc.)
  metadata        JSONB DEFAULT '{}', -- extra data (seo keywords, word count, tone, etc.)
  embedding       vector(1536),  -- text-embedding-3-small or gemini embedding vector
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contents"
  ON public.contents
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Indexes for contents
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON public.contents(user_id);
CREATE INDEX IF NOT EXISTS idx_contents_type ON public.contents(content_type);
CREATE INDEX IF NOT EXISTS idx_contents_status ON public.contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON public.contents(created_at DESC);

-- ============================================================
-- TABLE: vector_memory
-- Dedicated vector store for RAG "Digital Brain".
-- Stores embeddings + metadata of past high-performing content
-- for future context retrieval during generation.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vector_memory (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id    UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  chunk_text    TEXT NOT NULL,       -- the text chunk that was embedded
  embedding     vector(1536) NOT NULL, -- Gemini text-embedding-004 (768) or text-embedding-3-small (1536)
  metadata      JSONB DEFAULT '{}',  -- source, tags, performance score, etc.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vector_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vector memory"
  ON public.vector_memory
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- IVFFlat index for fast ANN similarity search
CREATE INDEX IF NOT EXISTS idx_vector_memory_embedding
  ON public.vector_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_vector_memory_user_id ON public.vector_memory(user_id);

-- ============================================================
-- TABLE: crawl_sources
-- RSS feed sources for news crawling.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crawl_sources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  feed_url        TEXT NOT NULL UNIQUE,
  max_posts       INT NOT NULL DEFAULT 10,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  last_crawled_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.crawl_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- TABLE: crawled_articles
-- Articles fetched from RSS feeds.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crawled_articles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id     UUID REFERENCES public.crawl_sources(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  url           TEXT NOT NULL UNIQUE,
  author        TEXT,
  published_at  TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crawled_articles_published_at ON public.crawled_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawled_articles_source_id ON public.crawled_articles(source_id);

-- Auto-publish columns for crawl_sources
DO $$ BEGIN
  ALTER TABLE public.crawl_sources ADD COLUMN auto_publish BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.crawl_sources ADD COLUMN auto_publish_platform TEXT DEFAULT 'facebook';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.crawl_sources ADD COLUMN auto_publish_tone TEXT DEFAULT 'professional';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- TABLE: crawl_schedules
-- Crawl automation schedule config.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crawl_schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_mode   TEXT NOT NULL DEFAULT 'interval',
  interval_minutes INT NOT NULL DEFAULT 10,
  daily_time      TIME DEFAULT '08:00:00',
  weekly_day      INT DEFAULT 1,
  weekly_time     TIME DEFAULT '08:00:00',
  monthly_day     INT DEFAULT 1,
  monthly_time    TIME DEFAULT '08:00:00',
  enabled         BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: published_articles
-- Tracks which crawled articles have been auto-published.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.published_articles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id      UUID REFERENCES public.crawled_articles(id) ON DELETE SET NULL,
  platform        TEXT NOT NULL,
  platform_post_id TEXT,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_published_articles_article_id ON public.published_articles(article_id);

-- ============================================================
-- TABLE: email_settings
-- Email notification config (single row, upserted).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  smtp_host       TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  smtp_port       INT NOT NULL DEFAULT 587,
  smtp_user       TEXT NOT NULL DEFAULT '',
  smtp_pass       TEXT NOT NULL DEFAULT '',
  recipient_email TEXT NOT NULL DEFAULT '',
  notify_on_publish BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: social_credentials
-- Server-side social media tokens for auto-publish.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.social_credentials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform        TEXT NOT NULL UNIQUE,
  access_token    TEXT NOT NULL DEFAULT '',
  page_id         TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: ai_config
-- AI provider configuration (single row).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_config (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider        TEXT NOT NULL DEFAULT 'gemini',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: connections
-- OAuth2 tokens for social media platforms.
-- ============================================================
CREATE TYPE platform_type AS ENUM ('facebook', 'instagram', 'x_twitter', 'youtube', 'threads', 'wordpress');

CREATE TABLE IF NOT EXISTS public.connections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        platform_type NOT NULL,
  access_token    TEXT,              -- encrypted at rest via pgcrypto
  refresh_token   TEXT,              -- encrypted at rest via pgcrypto
  token_expires_at TIMESTAMPTZ,
  platform_user_id TEXT,            -- FB page id, YT channel id, etc.
  metadata        JSONB DEFAULT '{}', -- extra platform-specific data
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, platform)         -- one connection per platform per user
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own connections"
  ON public.connections
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- HELPER: Match similar vector memories (cosine distance)
-- Used by RAG engine to find relevant past content.
-- ============================================================
CREATE OR REPLACE FUNCTION match_vector_memories(
  query_embedding vector(1536),
  p_user_id       UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count     INT  DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  content_id  UUID,
  chunk_text  TEXT,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vm.id,
    vm.content_id,
    vm.chunk_text,
    vm.metadata,
    1 - (vm.embedding <=> query_embedding) AS similarity
  FROM public.vector_memory vm
  WHERE vm.user_id = p_user_id
    AND 1 - (vm.embedding <=> query_embedding) > match_threshold
  ORDER BY vm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

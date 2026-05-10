// ============================================================
// OmniFlow AI — Shared TypeScript Types
// ============================================================

// ---- Enums -------------------------------------------------
export type ContentType =
  | 'blog'
  | 'social_fb'
  | 'social_ig'
  | 'social_x'
  | 'social_threads'
  | 'youtube_script'
  | 'docx_report';

export type ContentStatus = 'draft' | 'published' | 'failed' | 'archived';

export type PlatformType =
  | 'facebook'
  | 'instagram'
  | 'x_twitter'
  | 'youtube'
  | 'threads'
  | 'wordpress';

// ---- Database Tables ---------------------------------------
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  gemini_api_key: string | null;
  openrouter_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  content_type: ContentType;
  status: ContentStatus;
  source_idea: string | null;
  source_file_url: string | null;
  platform_post_id: string | null;
  metadata: Record<string, unknown>;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface VectorMemory {
  id: string;
  user_id: string;
  content_id: string | null;
  chunk_text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Connection {
  id: string;
  user_id: string;
  platform: PlatformType;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  platform_user_id: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Vector Search -----------------------------------------
export interface VectorMatch {
  id: string;
  content_id: string | null;
  chunk_text: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

// ---- Content Generation ------------------------------------
export interface GenerateInput {
  idea: string;
  docxFile?: File;
  platforms: PlatformType[];
  tone?: string;
  audience?: string;
}

export interface GenerateOutput {
  blog: GeneratedContent | null;
  socialPosts: GeneratedContent[];
  youtubeScript: GeneratedContent | null;
}

export interface GeneratedContent {
  title: string;
  body: string;
  content_type: ContentType;
  metadata: Record<string, unknown>;
}

// ---- News Crawler -------------------------------------------
export interface CrawlSource {
  id: string;
  name: string;
  feed_url: string;
  max_posts: number;
  enabled: boolean;
  last_crawled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoredDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  original_text: string | null;
  ai_summary: string | null;
  ai_json: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CrawledArticle {
  id: string;
  source_id: string;
  title: string;
  body: string;
  url: string;
  author: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CrawlResult {
  sources_crawled: number;
  articles_new: number;
  articles_skipped: number;
  errors: string[];
}

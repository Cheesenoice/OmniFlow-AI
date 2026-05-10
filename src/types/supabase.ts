/**
 * Lightweight Database type definition matching our Supabase schema.
 * For production, replace with: npx supabase gen types typescript --linked > src/types/supabase.ts
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          gemini_api_key: string | null;
          openrouter_api_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          gemini_api_key?: string | null;
          openrouter_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          gemini_api_key?: string | null;
          openrouter_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contents: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          body: string;
          content_type: 'blog' | 'social_fb' | 'social_ig' | 'social_x' | 'social_threads' | 'youtube_script' | 'docx_report';
          status: 'draft' | 'published' | 'failed' | 'archived';
          source_idea: string | null;
          source_file_url: string | null;
          platform_post_id: string | null;
          metadata: Record<string, unknown>;
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          body: string;
          content_type: 'blog' | 'social_fb' | 'social_ig' | 'social_x' | 'social_threads' | 'youtube_script' | 'docx_report';
          status?: 'draft' | 'published' | 'failed' | 'archived';
          source_idea?: string | null;
          source_file_url?: string | null;
          platform_post_id?: string | null;
          metadata?: Record<string, unknown>;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          body?: string;
          content_type?: 'blog' | 'social_fb' | 'social_ig' | 'social_x' | 'social_threads' | 'youtube_script' | 'docx_report';
          status?: 'draft' | 'published' | 'failed' | 'archived';
          source_idea?: string | null;
          source_file_url?: string | null;
          platform_post_id?: string | null;
          metadata?: Record<string, unknown>;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vector_memory: {
        Row: {
          id: string;
          user_id: string;
          content_id: string | null;
          chunk_text: string;
          embedding: number[];
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id?: string | null;
          chunk_text: string;
          embedding: number[];
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string | null;
          chunk_text?: string;
          embedding?: number[];
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      crawl_sources: {
        Row: {
          id: string;
          name: string;
          feed_url: string;
          max_posts: number;
          enabled: boolean;
          last_crawled_at: string | null;
          auto_publish: boolean;
          auto_publish_platform: string;
          auto_publish_tone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          feed_url: string;
          max_posts?: number;
          enabled?: boolean;
          last_crawled_at?: string | null;
          auto_publish?: boolean;
          auto_publish_platform?: string;
          auto_publish_tone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          feed_url?: string;
          max_posts?: number;
          enabled?: boolean;
          last_crawled_at?: string | null;
          auto_publish?: boolean;
          auto_publish_platform?: string;
          auto_publish_tone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      crawled_articles: {
        Row: {
          id: string;
          source_id: string | null;
          title: string;
          body: string;
          url: string;
          author: string | null;
          published_at: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id?: string | null;
          title: string;
          body?: string;
          url: string;
          author?: string | null;
          published_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string | null;
          title?: string;
          body?: string;
          url?: string;
          author?: string | null;
          published_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      crawl_schedules: {
        Row: {
          id: string;
          schedule_mode: string;
          interval_minutes: number;
          daily_time: string | null;
          weekly_day: number | null;
          weekly_time: string | null;
          monthly_day: number | null;
          monthly_time: string | null;
          enabled: boolean;
          last_triggered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_mode?: string;
          interval_minutes?: number;
          daily_time?: string | null;
          weekly_day?: number | null;
          weekly_time?: string | null;
          monthly_day?: number | null;
          monthly_time?: string | null;
          enabled?: boolean;
          last_triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          schedule_mode?: string;
          interval_minutes?: number;
          daily_time?: string | null;
          weekly_day?: number | null;
          weekly_time?: string | null;
          monthly_day?: number | null;
          monthly_time?: string | null;
          enabled?: boolean;
          last_triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      published_articles: {
        Row: {
          id: string;
          article_id: string | null;
          platform: string;
          platform_post_id: string | null;
          published_at: string;
        };
        Insert: {
          id?: string;
          article_id?: string | null;
          platform: string;
          platform_post_id?: string | null;
          published_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string | null;
          platform?: string;
          platform_post_id?: string | null;
          published_at?: string;
        };
      };
      ai_config: {
        Row: { id: string; provider: string; created_at: string; updated_at: string };
        Insert: { id?: string; provider?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; provider?: string; created_at?: string; updated_at?: string };
      };
      email_settings: {
        Row: {
          id: string;
          smtp_host: string;
          smtp_port: number;
          smtp_user: string;
          smtp_pass: string;
          recipient_email: string;
          notify_on_publish: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          smtp_host?: string;
          smtp_port?: number;
          smtp_user?: string;
          smtp_pass?: string;
          recipient_email?: string;
          notify_on_publish?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          smtp_host?: string;
          smtp_port?: number;
          smtp_user?: string;
          smtp_pass?: string;
          recipient_email?: string;
          notify_on_publish?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      stored_documents: {
        Row: { id: string; file_name: string; file_type: string; file_size: number | null; original_text: string | null; ai_summary: string | null; ai_json: Record<string, unknown>; embedding: number[] | null; metadata: Record<string, unknown>; created_at: string };
        Insert: { id?: string; file_name: string; file_type: string; file_size?: number | null; original_text?: string | null; ai_summary?: string | null; ai_json?: Record<string, unknown>; embedding?: number[] | null; metadata?: Record<string, unknown>; created_at?: string };
        Update: { id?: string; file_name?: string; file_type?: string; file_size?: number | null; original_text?: string | null; ai_summary?: string | null; ai_json?: Record<string, unknown>; embedding?: number[] | null; metadata?: Record<string, unknown>; created_at?: string };
      };
      connections: {
        Row: {
          id: string;
          user_id: string;
          platform: 'facebook' | 'instagram' | 'x_twitter' | 'youtube' | 'threads' | 'wordpress';
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          platform_user_id: string | null;
          metadata: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: 'facebook' | 'instagram' | 'x_twitter' | 'youtube' | 'threads' | 'wordpress';
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          platform_user_id?: string | null;
          metadata?: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: 'facebook' | 'instagram' | 'x_twitter' | 'youtube' | 'threads' | 'wordpress';
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          platform_user_id?: string | null;
          metadata?: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      match_vector_memories: {
        Args: {
          query_embedding: number[];
          p_user_id: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          content_id: string | null;
          chunk_text: string;
          metadata: Record<string, unknown>;
          similarity: number;
        }[];
      };
    };
  };
}

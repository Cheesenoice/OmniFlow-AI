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

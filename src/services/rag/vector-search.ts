/**
 * RAG Vector Search service.
 * Queries Supabase pgvector for semantically similar past content.
 */
import { createServerSupabase } from '@/lib/supabase/server';
import type { VectorMatch } from '@/types';

export interface RetrievedContext {
  content: string;
  similarity: number;
  sourceTitle: string | null;
  contentType: string;
}

/**
 * Search vector_memory for chunks similar to the query embedding.
 * Returns top-k matches with their content and metadata.
 */
export async function searchSimilarContent(
  queryEmbedding: number[],
  userId: string,
  limit = 5,
  threshold = 0.6,
): Promise<RetrievedContext[]> {
  const supabase = await createServerSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('match_vector_memories', {
    query_embedding: queryEmbedding,
    p_user_id: userId,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    console.error('RAG search error:', error);
    return [];
  }

  const matches = data as VectorMatch[];

  // Enrich with content title from contents table
  const contentIds = [...new Set(matches.map((m) => m.content_id).filter(Boolean))] as string[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contents } = contentIds.length > 0
    ? await (supabase as any)
        .from('contents')
        .select('id, title, content_type')
        .in('id', contentIds)
    : { data: [] };

  const titleMap = new Map((contents as any[])?.map((c: any) => [c.id, { title: c.title, type: c.content_type }]));

  return matches.map((m) => ({
    content: m.chunk_text,
    similarity: m.similarity,
    sourceTitle: m.content_id ? titleMap.get(m.content_id)?.title ?? null : null,
    contentType: m.content_id ? titleMap.get(m.content_id)?.type ?? 'unknown' : 'unknown',
  }));
}

/**
 * Format retrieved context into a string for injection into prompt.
 */
export function formatContextForPrompt(contexts: RetrievedContext[]): string {
  if (contexts.length === 0) return '';

  const parts = contexts.map(
    (c, i) =>
      `[Memory ${i + 1}] (${(c.similarity * 100).toFixed(0)}% match, from: ${c.sourceTitle ?? 'unknown'})\n${c.content}`,
  );

  return `--- RELEVANT PAST CONTENT (Digital Brain) ---\n${parts.join('\n\n')}\n--- END CONTEXT ---`;
}

/**
 * Embedding service — generates vector embeddings via Gemini.
 * Used for RAG: convert text → vector → store/find similar content.
 */
import { geminiEmbed } from '@/lib/ai/gemini';

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIM = 768; // Gemini text-embedding-004 dimension

export interface EmbeddedChunk {
  text: string;
  embedding: number[];
}

/**
 * Generate embeddings for multiple text chunks.
 * Gemini embedding API processes one text per call; we batch sequentially.
 */
export async function embedTexts(texts: string[]): Promise<EmbeddedChunk[]> {
  if (texts.length === 0) return [];

  const embeddings = await geminiEmbed({ texts, model: EMBEDDING_MODEL });

  return texts.map((text, i) => ({
    text,
    embedding: embeddings[i] ?? [],
  }));
}

/**
 * Generate a single embedding for a query text.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const result = await embedTexts([text]);
  return result[0]?.embedding ?? [];
}

export { EMBEDDING_MODEL, EMBEDDING_DIM };

/**
 * Parse .docx files using mammoth.
 * Extracts raw text from Word documents for AI processing.
 */
import mammoth from 'mammoth';

export interface DocxResult {
  text: string;
  wordCount: number;
  warnings: string[];
}

export async function parseDocxBuffer(buffer: Buffer): Promise<DocxResult> {
  const result = await mammoth.extractRawText({ buffer });

  return {
    text: result.value.trim(),
    wordCount: result.value.split(/\s+/).filter(Boolean).length,
    warnings: result.messages.map((m) => m.message),
  };
}

export async function parseDocxFile(file: File): Promise<DocxResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return parseDocxBuffer(buffer);
}

/**
 * Chunk text into overlapping segments for RAG embedding.
 * ~500 chars per chunk, 100 char overlap.
 */
export function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

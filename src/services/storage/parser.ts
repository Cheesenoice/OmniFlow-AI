/**
 * Parse docx / PDF → plain text.
 */
import mammoth from 'mammoth';

export interface ParseResult {
  text: string;
  wordCount: number;
  error?: string;
}

export async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  return { text, wordCount: text.split(/\s+/).filter(Boolean).length };
}

export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  // Lazy CJS import to avoid bundler issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  const text = (data as { text: string }).text.trim();
  return { text, wordCount: text.split(/\s+/).filter(Boolean).length };
}

export async function parseFile(file: File): Promise<ParseResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    return parseDocx(buffer);
  }
  if (name.endsWith('.pdf')) {
    return parsePdf(buffer);
  }
  return { text: '', wordCount: 0, error: `Unsupported file type: ${file.type || name}` };
}

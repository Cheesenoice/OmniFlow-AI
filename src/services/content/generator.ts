/**
 * Central Content Generation Engine.
 * Orchestrates: Docx parsing → Embedding → RAG search → Multi-platform generation.
 */
import { geminiGenerate } from '@/lib/ai/gemini';
import { parseDocxFile, chunkText } from './docx-parser';
import { embedTexts, embedQuery } from '../rag/embeddings';
import { searchSimilarContent, formatContextForPrompt } from '../rag/vector-search';
import { buildGenerationPrompt } from './prompts';
import type { PlatformType, GeneratedContent } from '@/types';

export interface GenerateParams {
  idea: string;
  platforms: PlatformType[];
  tone: string;
  audience: string;
  docxFile?: File;
  userId?: string;
}

export interface GenerateResult {
  items: GeneratedContent[];
  ragContextUsed: boolean;
  docxWordCount: number | null;
  errors: string[];
}

/**
 * Main generation pipeline.
 */
export async function generateContent(params: GenerateParams): Promise<GenerateResult> {
  const { idea, platforms, tone, audience, docxFile, userId } = params;
  const errors: string[] = [];
  let ragContextUsed = false;
  let docxWordCount: number | null = null;

  // --- Step 1: Extract text from docx if provided ---
  let combinedText = idea;

  if (docxFile) {
    try {
      const docxResult = await parseDocxFile(docxFile);
      docxWordCount = docxResult.wordCount;
      combinedText = `${idea}\n\n--- Source Document Content ---\n${docxResult.text}`;

      if (docxResult.warnings.length > 0) {
        errors.push(`Docx warnings: ${docxResult.warnings.join('; ')}`);
      }
    } catch (err) {
      errors.push(`Failed to parse docx: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // --- Step 2: RAG — find similar past content ---
  let contextFromRAG = '';

  if (userId) {
    try {
      const queryEmbedding = await embedQuery(combinedText.slice(0, 2000));

      if (queryEmbedding.length > 0) {
        const similarContent = await searchSimilarContent(queryEmbedding, userId, 3, 0.6);

        if (similarContent.length > 0) {
          contextFromRAG = formatContextForPrompt(similarContent);
          ragContextUsed = true;
        }
      }
    } catch (err) {
      errors.push(`RAG search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // Non-fatal — continue without RAG context
    }
  }

  // --- Step 3: Generate content for each platform ---
  const items: GeneratedContent[] = [];

  for (const platform of platforms) {
    try {
      const { prompt, config } = buildGenerationPrompt({
        idea: combinedText,
        platform,
        tone,
        audience,
        contextFromRAG,
      });

      const body = await geminiGenerate({
        prompt,
        systemInstruction: config.systemPrompt,
        model: 'gemini-2.5-flash',
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      });

      const title = extractTitle(body, platform);

      items.push({
        title,
        body,
        content_type: config.contentType as GeneratedContent['content_type'],
        metadata: {
          platform,
          tone,
          audience,
          rag_used: ragContextUsed,
          model: 'gemini-2.5-flash',
        },
      });
    } catch (err) {
      errors.push(
        `Failed to generate ${platform}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  return { items, ragContextUsed, docxWordCount, errors };
}

function extractTitle(body: string, platform: string): string {
  // Try to get first # heading
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1];

  // Try first line
  const firstLine = body.split('\n')[0];
  if (firstLine.length <= 120) return firstLine.trim();

  return `${platform} Content`;
}

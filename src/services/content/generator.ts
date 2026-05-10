/**
 * Central Content Generation Engine.
 * Orchestrates: Docx parsing → Embedding → RAG search → Batch multi-platform generation.
 */
import { smartGenerate } from "@/lib/ai/smart-generate";
import { parseDocxFile, chunkText } from "./docx-parser";
import { embedTexts, embedQuery } from "../rag/embeddings";
import {
  searchSimilarContent,
  formatContextForPrompt,
} from "../rag/vector-search";
import { buildBatchPrompt, platformToPromptKey } from "./prompts";
import type { PlatformType, GeneratedContent } from "@/types";

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
 * Main generation pipeline — batches all platforms in ONE API call.
 */
export async function generateContent(
  params: GenerateParams,
): Promise<GenerateResult> {
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
        errors.push(`Docx warnings: ${docxResult.warnings.join("; ")}`);
      }
    } catch (err) {
      errors.push(
        `Failed to parse docx: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  // --- Step 2: RAG — find similar past content ---
  let contextFromRAG = "";

  if (userId) {
    try {
      const queryEmbedding = await embedQuery(combinedText.slice(0, 2000));

      if (queryEmbedding.length > 0) {
        const similarContent = await searchSimilarContent(
          queryEmbedding,
          userId,
          3,
          0.6,
        );

        if (similarContent.length > 0) {
          contextFromRAG = formatContextForPrompt(similarContent);
          ragContextUsed = true;
        }
      }
    } catch (err) {
      errors.push(
        `RAG search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  // --- Step 3: Batch-generate all platforms in ONE API call ---
  const items: GeneratedContent[] = [];

  try {
    const { prompt, systemInstruction } = buildBatchPrompt({
      idea: combinedText,
      platforms,
      tone,
      audience,
      contextFromRAG,
    });

    const raw = await smartGenerate({
      prompt,
      systemInstruction,
      model: "gemini-flash-lite-latest",
      temperature: 0.7,
      maxOutputTokens: 8192,
    });

    const jsonStr = raw.replace(/```json\s*|```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (!entry || !entry.body) continue;
        const ct = platformToPromptKey(entry.platform || "");
        items.push({
          title: entry.title || "",
          body: entry.body,
          content_type: ct as GeneratedContent["content_type"],
          metadata: {
            platform: entry.platform,
            tone,
            audience,
            rag_used: ragContextUsed,
            model: "gemini-flash-lite-latest",
          },
        });
      }
    }
  } catch (err) {
    errors.push(
      `Batch generation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }

  return { items, ragContextUsed, docxWordCount, errors };
}

export interface AutoPublishArticle {
  title: string;
  body: string;
  url: string;
  source: string;
  tone: string;
}

/**
 * Batch-generate Facebook posts for multiple articles in ONE API call.
 * Returns an array of {title, content} parsed from JSON response.
 */
export async function generateBatchForAutoPublish(
  articles: AutoPublishArticle[],
): Promise<(string | null)[]> {
  if (articles.length === 0) return [];

  const articlesBlock = articles
    .map(
      (a, i) =>
        `[ARTICLE ${i + 1}]
Source: ${a.source}
Title: ${a.title}
URL: ${a.url}
Content: ${a.body.slice(0, 1500)}`,
    )
    .join("\n\n---\n\n");

  const prompt = `You are a social media manager. Write a Facebook post for EACH of the ${articles.length} articles below.

Return ONLY a valid JSON array with this exact structure:
[{"index": 1, "content": "Facebook post here"}, ...]

- "index" MUST match the ARTICLE number (1 to ${articles.length})
- Return EXACTLY ${articles.length} items, one per article
- Keep the same order

Requirements per post:
- Write in Vietnamese
- Include a catchy headline + 2-3 key sentences
- At the end, add a CTA with the FULL URL from the article (e.g., "Đọc thêm tại: https://vnexpress.net/...")
- Use the ACTUAL URL, do NOT write "[Link]" as placeholder
- Use appropriate emojis
- Under 400 words each
- NO hashtags
- Plain text, no markdown

Articles:
${articlesBlock}`;

  console.log(
    `[OmniFlow Gen] Batch generating ${articles.length} posts in 1 API call...`,
  );

  // Init result array with nulls
  const results: (string | null)[] = new Array(articles.length).fill(null);

  const model = "gemini-flash-lite-latest";
  try {
    const raw = await smartGenerate({
      prompt,
      model,
      temperature: 0.7,
      maxOutputTokens: 8192,
    });

    const jsonStr = raw.replace(/```json\s*|```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const idx = (item.index ?? item.idx ?? 1) - 1; // 1-based → 0-based
        if (idx >= 0 && idx < articles.length && item.content) {
          results[idx] = item.content;
        }
      }
      const filled = results.filter((r) => r !== null).length;
      console.log(
        `[OmniFlow Gen] Batch result: ${filled}/${articles.length} posts generated.`,
      );
    }
  } catch (err) {
    console.log(
      `[OmniFlow Gen] Batch API failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    // Fallback: use article body as post
    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      results[i] =
        `${a.title}\n\n${a.body.slice(0, 1500).trim()}\n\nĐọc thêm: ${a.url}`;
    }
  }

  return results;
}

/**
 * Google Gemini AI client utility.
 * Uses Gemini API for both text generation and embeddings.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiGenerateParams {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiEmbedParams {
  texts: string[];
  model?: string;
}

/**
 * Generate text with Gemini.
 * Model default: gemini-2.5-flash (fast + capable).
 */
export async function geminiGenerate({
  prompt,
  systemInstruction,
  model = 'gemini-2.5-flash',
  temperature = 0.7,
  maxOutputTokens = 8192,
}: GeminiGenerateParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const contents: Array<Record<string, unknown>> = [];
  if (systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: systemInstruction }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood.' }],
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature, maxOutputTokens },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/**
 * Generate embeddings with Gemini text-embedding-004.
 * Returns 768-dimensional vectors.
 */
export async function geminiEmbed({
  texts,
  model = 'text-embedding-004',
}: GeminiEmbedParams): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const embeddings: number[][] = [];

  for (const text of texts) {
    const res = await fetch(
      `${GEMINI_API_BASE}/models/${model}:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text }] },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini Embedding API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    embeddings.push(data.embedding?.values ?? []);
  }

  return embeddings;
}

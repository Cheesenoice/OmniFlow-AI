/**
 * Groq AI client — OpenAI-compatible API.
 * Models: llama-3.1-8b-instant (~500-800 tok/s), llama-3.3-70b, etc.
 */

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export interface GroqGenerateParams {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function groqGenerate({
  prompt,
  systemInstruction,
  model = 'llama-3.1-8b-instant',
  temperature = 0.7,
  maxOutputTokens = 8192,
}: GroqGenerateParams): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');

  const messages: Array<{ role: string; content: string }> = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxOutputTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return text;
}

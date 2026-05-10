/**
 * Smart AI generate — reads provider from DB, dispatches to Gemini or Groq.
 */
import { createServiceSupabase } from '@/lib/supabase/server';
import { geminiGenerate } from './gemini';
import { groqGenerate } from './groq';

interface SmartGenParams {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function smartGenerate(params: SmartGenParams): Promise<string> {
  const supabase = createServiceSupabase();
  let provider = 'gemini';

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('ai_config')
      .select('provider')
      .limit(1)
      .single();
    if (data?.provider) provider = data.provider;
  } catch {
    // Fall back to gemini if DB not available
  }

  console.log(`[AI SmartGen] Provider: ${provider}, model: ${params.model || 'default'}`);

  if (provider === 'groq') {
    return groqGenerate({
      prompt: params.prompt,
      systemInstruction: params.systemInstruction,
      model: 'llama-3.1-8b-instant',
      temperature: params.temperature,
      maxOutputTokens: params.maxOutputTokens,
    });
  }

  // Default: Gemini
  return geminiGenerate(params);
}

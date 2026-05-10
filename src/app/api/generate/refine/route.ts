import { NextRequest, NextResponse } from 'next/server';
import { smartGenerate } from '@/lib/ai/smart-generate';

export async function POST(request: NextRequest) {
  try {
    const { originalText, instruction, platform } = await request.json();

    if (!originalText || !instruction) {
      return NextResponse.json({ error: 'originalText and instruction are required' }, { status: 400 });
    }

    const systemInstruction = `You are an expert content editor. Edit the following text according to the user's instruction.

CRITICAL RULES:
- Return ONLY the edited text, nothing else
- No markdown wrappers, no code fences, no explanations
- Keep the same language as the original unless instructed otherwise
- Preserve any relevant hashtags if present
- The text is a ${platform || 'social media'} post`;

    const prompt = `Original text:
---
${originalText}
---

Instruction: ${instruction}

Edited text:`;

    const refined = await smartGenerate({
      prompt,
      systemInstruction,
      model: 'gemini-flash-lite-latest',
      temperature: 0.7,
      maxOutputTokens: 4096,
    });

    return NextResponse.json({ refined });
  } catch (err) {
    console.error('[Refine API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Refine failed' },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';

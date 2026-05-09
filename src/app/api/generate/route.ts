import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/services/content/generator';
import type { PlatformType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const idea = formData.get('idea');
    const platformsRaw = formData.get('platforms');
    const tone = formData.get('tone');
    const audience = formData.get('audience');
    const docxFile = formData.get('docx');
    // userId will come from Supabase auth session (Phase 4)
    // For now, skip RAG if not authenticated

    if (!idea || typeof idea !== 'string' || !idea.trim()) {
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
    }

    if (!platformsRaw || typeof platformsRaw !== 'string') {
      return NextResponse.json({ error: 'At least one platform is required' }, { status: 400 });
    }

    let platforms: PlatformType[];
    try {
      platforms = JSON.parse(platformsRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid platforms format' }, { status: 400 });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform is required' }, { status: 400 });
    }

    const result = await generateContent({
      idea: idea.trim(),
      platforms,
      tone: typeof tone === 'string' ? tone : 'professional',
      audience: typeof audience === 'string' ? audience : 'general',
      docxFile: docxFile instanceof File ? docxFile : undefined,
      // userId omitted for now — RAG requires Supabase auth (Phase 4)
    });

    return NextResponse.json({
      items: result.items,
      ragContextUsed: result.ragContextUsed,
      docxWordCount: result.docxWordCount,
      errors: result.errors,
    });
  } catch (err) {
    console.error('Generate API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { runCrawlPipeline } from '@/services/crawler/runner';

export async function POST() {
  try {
    const result = await runCrawlPipeline();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Crawl trigger error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Crawl failed' },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';

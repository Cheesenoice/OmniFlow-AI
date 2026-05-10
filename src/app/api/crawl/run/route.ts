import { NextRequest, NextResponse } from 'next/server';
import { crawlAllSources } from '@/services/crawler';

/**
 * Cron endpoint for automated crawling.
 * Call: GET /api/crawl/run?secret=CRON_SECRET
 * Compatible with Vercel Cron Jobs or any external scheduler.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await crawlAllSources();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Crawl run error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Crawl failed' },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';

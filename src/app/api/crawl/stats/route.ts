import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const today = new Date().toISOString().split('T')[0];

  // Total articles
  const { count: total } = await db
    .from('crawled_articles')
    .select('*', { count: 'exact', head: true });

  // Today's articles
  const { count: todayCount } = await db
    .from('crawled_articles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);

  // By source
  const { data: bySource } = await db
    .from('crawled_articles')
    .select('crawl_sources!inner(name)');

  const sourceMap: Record<string, number> = {};
  for (const row of bySource ?? []) {
    const name = row.crawl_sources?.name ?? 'Unknown';
    sourceMap[name] = (sourceMap[name] || 0) + 1;
  }

  // Sources count
  const { count: sourcesCount } = await db
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', true);

  // Last crawl
  const { data: lastCrawl } = await db
    .from('crawl_sources')
    .select('last_crawled_at')
    .order('last_crawled_at', { ascending: false })
    .limit(1)
    .single();

  // Missing sources (not crawled today)
  const { data: missingSources } = await db
    .from('crawl_sources')
    .select('name')
    .eq('enabled', true)
    .or(`last_crawled_at.lt.${today},last_crawled_at.is.null`);

  return NextResponse.json({
    total: total ?? 0,
    today: todayCount ?? 0,
    sourcesCount: sourcesCount ?? 0,
    bySource: sourceMap,
    lastCrawledAt: lastCrawl?.last_crawled_at ?? null,
    isFullyCrawled: (missingSources ?? []).length === 0,
    missingSources: (missingSources ?? []).map((s: { name: string }) => s.name),
  });
}

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { autoPublishNewArticles } from '@/services/crawler/auto-publish';
import { sendPublishNotification } from '@/services/notifications/email';

/**
 * TEST ENDPOINT: Forces auto-publish on recent articles from auto-publish sources,
 * regardless of whether they were already published.
 * DELETE or disable in production.
 */
export async function POST() {
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get auto-publish sources
  const { data: autoSources } = await db
    .from('crawl_sources')
    .select('id, name, auto_publish_platform, auto_publish_tone')
    .eq('auto_publish', true)
    .eq('enabled', true);

  if (!autoSources || autoSources.length === 0) {
    return NextResponse.json({ error: 'No auto-publish sources configured' }, { status: 400 });
  }

  const sourceMap: Record<string, { name: string; auto_publish_platform: string; auto_publish_tone: string }> = {};
  for (const s of autoSources) {
    sourceMap[s.id] = { name: s.name, auto_publish_platform: s.auto_publish_platform, auto_publish_tone: s.auto_publish_tone };
  }

  // Get 1 latest article from each auto-publish source
  const rawArticles: any[] = [];
  for (const sourceId of Object.keys(sourceMap)) {
    const { data: articles } = await db
      .from('crawled_articles')
      .select('id, source_id, title, body, url, metadata')
      .eq('source_id', sourceId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (articles) rawArticles.push(...articles);
  }

  if (rawArticles.length === 0) {
    return NextResponse.json({ error: 'No articles found for auto-publish sources' }, { status: 400 });
  }

  // Map to PublishableArticle with image_url extracted from metadata
  const allArticles = rawArticles.map((a: any) => ({
    id: a.id,
    source_id: a.source_id,
    title: a.title,
    body: a.body,
    url: a.url,
    image_url: a.metadata?.image_url || undefined,
  }));

  console.log(`[TEST PUBLISH] Found ${allArticles.length} articles, images: ${allArticles.filter((a: any) => a.image_url).length}`);
  const publishResult = await autoPublishNewArticles(allArticles, sourceMap);

  // Try email
  let emailSent = false;
  if (publishResult.published > 0) {
    const { data: emailCfg } = await db
      .from('email_settings')
      .select('*')
      .limit(1)
      .single();

    if (emailCfg?.notify_on_publish && emailCfg.smtp_user && emailCfg.recipient_email) {
      const publishedArticles = publishResult.results
        .filter((r) => r.success)
        .map((r) => ({
          title: r.title,
          url: allArticles.find((a: { id: string }) => a.id === r.articleId)?.url ?? '',
          platform: r.platform,
          publishedAt: new Date().toISOString(),
        }));
      emailSent = await sendPublishNotification(emailCfg, publishedArticles);
    }
  }

  return NextResponse.json({ publish: publishResult, emailSent });
}

export const runtime = 'nodejs';

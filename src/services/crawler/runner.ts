import { createServiceSupabase } from '@/lib/supabase/server';
import { crawlAllSources } from './index';
import { autoPublishNewArticles } from './auto-publish';
import { sendPublishNotification } from '@/services/notifications/email';

const TAG = '[OmniFlow Runner]';

export interface RunnerResult {
  crawl: { sources_crawled: number; articles_new: number; articles_skipped: number; errors: string[] };
  publish: { published: number; failed: number; results: { articleId: string; title: string; platform: string; success: boolean; error?: string }[] } | null;
  emailSent: boolean;
}

export async function runCrawlPipeline(): Promise<RunnerResult> {
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. Crawl
  console.log(`${TAG} Starting crawl...`);
  const crawlResult = await crawlAllSources();
  console.log(`${TAG} Crawl done: ${crawlResult.sources_crawled} sources, ${crawlResult.articles_new} new, ${crawlResult.articles_skipped} skipped, ${crawlResult.errors.length} errors`);
  if (crawlResult.errors.length > 0) {
    console.log(`${TAG} Crawl errors:`, crawlResult.errors);
  }

  // 2. Auto-publish
  console.log(`${TAG} Checking auto-publish sources...`);
  const { data: autoSources, error: autoSrcErr } = await db
    .from('crawl_sources')
    .select('id, name, auto_publish_platform, auto_publish_tone')
    .eq('auto_publish', true)
    .eq('enabled', true);

  if (autoSrcErr) {
    console.log(`${TAG} ERROR fetching auto-publish sources:`, autoSrcErr);
  }
  console.log(`${TAG} Auto-publish sources found: ${autoSources?.length ?? 0}`);
  if (autoSources) {
    for (const s of autoSources) {
      console.log(`${TAG}   - ${s.name} (platform=${s.auto_publish_platform}, tone=${s.auto_publish_tone})`);
    }
  }

  let publishResult: RunnerResult['publish'] = null;
  let emailSent = false;

  if (!autoSources || autoSources.length === 0) {
    console.log(`${TAG} SKIP publish: no sources with auto_publish=true.`);
  } else if (crawlResult.articles_new === 0) {
    console.log(`${TAG} SKIP publish: no new articles from crawl.`);
  } else {
    console.log(`${TAG} Proceeding to publish ${crawlResult.articles_new} new articles...`);

    const sourceMap: Record<string, { name: string; auto_publish_platform: string; auto_publish_tone: string }> = {};
    for (const s of autoSources) {
      sourceMap[s.id] = { name: s.name, auto_publish_platform: s.auto_publish_platform, auto_publish_tone: s.auto_publish_tone };
    }

    const sourceIds = Object.keys(sourceMap);
    const { data: newArticles } = await db
      .from('crawled_articles')
      .select('id, source_id, title, body, url, metadata')
      .in('source_id', sourceIds)
      .order('created_at', { ascending: false })
      .limit(crawlResult.articles_new * 2);

    console.log(`${TAG} Recent articles from auto-publish sources: ${newArticles?.length ?? 0}`);

    if (!newArticles || newArticles.length === 0) {
      console.log(`${TAG} SKIP publish: no recent articles found for auto-publish sources.`);
    } else {
      const articleIds = newArticles.map((a: { id: string }) => a.id);
      const { data: alreadyPublished } = await db
        .from('published_articles')
        .select('article_id')
        .in('article_id', articleIds);

      const publishedIds = new Set((alreadyPublished ?? []).map((p: { article_id: string }) => p.article_id));
      const toPublish = newArticles.filter((a: { id: string }) => !publishedIds.has(a.id));

      console.log(`${TAG} Already published: ${publishedIds.size}, to publish: ${toPublish.length}`);

      if (toPublish.length === 0) {
        console.log(`${TAG} SKIP publish: all articles already published.`);
      } else {
        console.log(`${TAG} Calling autoPublishNewArticles with ${toPublish.length} articles...`);
        publishResult = await autoPublishNewArticles(toPublish, sourceMap);
        console.log(`${TAG} Publish result: ${publishResult.published} published, ${publishResult.failed} failed`);
        for (const r of publishResult.results) {
          console.log(`${TAG}   - ${r.title.slice(0, 60)}... [${r.platform}] success=${r.success} ${r.error ? 'err=' + r.error : ''}`);
        }

        // 3. Email
        if (publishResult.published > 0) {
          console.log(`${TAG} Checking email config...`);
          const { data: emailCfg } = await db
            .from('email_settings')
            .select('*')
            .limit(1)
            .single();

          console.log(`${TAG} Email config:`, emailCfg ? {
            host: emailCfg.smtp_host,
            port: emailCfg.smtp_port,
            user: emailCfg.smtp_user ? emailCfg.smtp_user.slice(0, 5) + '...' : '(empty)',
            recipient: emailCfg.recipient_email || '(empty)',
            notify: emailCfg.notify_on_publish,
          } : '(none)');

          if (!emailCfg) {
            console.log(`${TAG} SKIP email: no email_settings row in DB.`);
          } else if (!emailCfg.notify_on_publish) {
            console.log(`${TAG} SKIP email: notify_on_publish is false.`);
          } else if (!emailCfg.smtp_user) {
            console.log(`${TAG} SKIP email: smtp_user is empty.`);
          } else if (!emailCfg.recipient_email) {
            console.log(`${TAG} SKIP email: recipient_email is empty.`);
          } else {
            const publishedArticles = publishResult.results
              .filter((r: { success: boolean }) => r.success)
              .map((r: { articleId: string; title: string; platform: string }) => ({
                title: r.title,
                url: (newArticles as { id: string; url: string }[]).find((a) => a.id === r.articleId)?.url ?? '',
                platform: r.platform,
                publishedAt: new Date().toISOString(),
              }));
            console.log(`${TAG} Sending email for ${publishedArticles.length} articles...`);
            emailSent = await sendPublishNotification(emailCfg, publishedArticles);
            console.log(`${TAG} Email sent: ${emailSent}`);
          }
        } else {
          console.log(`${TAG} SKIP email: no articles published successfully.`);
        }
      }
    }
  }

  // 4. Update schedule
  const { data: sched } = await db.from('crawl_schedules').select('id').limit(1).single();
  if (sched) {
    await db.from('crawl_schedules').update({ last_triggered_at: new Date().toISOString() }).eq('id', sched.id);
    console.log(`${TAG} Updated last_triggered_at.`);
  }

  console.log(`${TAG} Pipeline complete.`);
  return { crawl: crawlResult, publish: publishResult, emailSent };
}

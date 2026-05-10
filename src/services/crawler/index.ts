import { createServiceSupabase } from '@/lib/supabase/server';
import { crawlRssFeed } from './rss';
import { scrapeArticle } from './scraper';
import type { CrawlResult } from '@/types';

/**
 * Crawl all enabled RSS sources and store new articles.
 * Fetches full article content by scraping each article page.
 * Uses service_role client to bypass RLS.
 */
export async function crawlAllSources(): Promise<CrawlResult> {
  const supabase = createServiceSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sources, error: srcError } = await (supabase as any)
    .from('crawl_sources')
    .select('id, name, feed_url, max_posts')
    .eq('enabled', true);

  if (srcError || !sources) {
    return {
      sources_crawled: 0,
      articles_new: 0,
      articles_skipped: 0,
      errors: [srcError?.message ?? 'No sources found'],
    };
  }

  let articlesNew = 0;
  let articlesSkipped = 0;
  const errors: string[] = [];

  for (const source of sources) {
    try {
      const rssArticles = await crawlRssFeed(source.feed_url, source.max_posts);

      if (rssArticles.length === 0) continue;

      // Deduplicate: skip articles whose URL already exists
      const urls = rssArticles.map((a) => a.url).filter(Boolean);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from('crawled_articles')
        .select('url')
        .in('url', urls);

      const existingUrls = new Set((existing ?? []).map((e: { url: string }) => e.url));

      const newRssArticles = rssArticles.filter((a) => !existingUrls.has(a.url));

      // Scrape full content for each new article
      const articlesToInsert = [];
      for (const rssArticle of newRssArticles) {
        let fullBody = rssArticle.body;
        let author = rssArticle.author;
        let publishedAt = rssArticle.published_at;

        // Try to get full content from the article page
        if (rssArticle.url) {
          const scraped = await scrapeArticle(rssArticle.url);
          if (scraped) {
            fullBody = scraped.body || fullBody;
            author = scraped.author ?? author;
            publishedAt = scraped.publishedAt ?? publishedAt;
          }
        }

        articlesToInsert.push({
          source_id: source.id,
          title: rssArticle.title,
          body: fullBody,
          url: rssArticle.url,
          author,
          published_at: publishedAt,
          metadata: { image_url: rssArticle.image_url },
        });
      }

      if (articlesToInsert.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('crawled_articles')
          .insert(articlesToInsert);

        if (insertError) {
          errors.push(`${source.name}: insert failed — ${insertError.message}`);
        } else {
          articlesNew += articlesToInsert.length;
        }
      }

      articlesSkipped += rssArticles.length - articlesToInsert.length;

      // Update last_crawled_at
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('crawl_sources')
        .update({ last_crawled_at: new Date().toISOString() })
        .eq('id', source.id);
    } catch (err) {
      errors.push(`${source.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return {
    sources_crawled: sources.length,
    articles_new: articlesNew,
    articles_skipped: articlesSkipped,
    errors,
  };
}

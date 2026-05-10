import RssParser from 'rss-parser';

const parser = new RssParser();

export interface RssArticle {
  title: string;
  body: string;
  url: string;
  author: string | null;
  published_at: string | null;
  image_url: string | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractBody(item: RssParser.Item): string {
  // Prefer full HTML content (content:encoded), then snippet, then summary
  const raw = item.content ?? item.contentSnippet ?? item.summary ?? '';
  if (!raw) return '';

  // If it's HTML (has tags), strip them for clean text
  if (/<\/?[a-z][\s\S]*>/i.test(raw)) {
    return stripHtml(raw);
  }

  return raw;
}

/**
 * Parse RSS/Atom feed and extract articles up to maxPosts.
 */
export async function crawlRssFeed(
  feedUrl: string,
  maxPosts: number,
): Promise<RssArticle[]> {
  const feed = await parser.parseURL(feedUrl);

  const items = (feed.items ?? []).slice(0, maxPosts);

  return items.map((item) => ({
    title: item.title ?? 'Untitled',
    body: extractBody(item),
    url: item.link ?? '',
    author: item.creator ?? item.author ?? null,
    published_at: item.isoDate ?? (item.pubDate ? new Date(item.pubDate).toISOString() : null),
    image_url: item.enclosure?.url ?? null,
  }));
}

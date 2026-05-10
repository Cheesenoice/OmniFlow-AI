import * as cheerio from 'cheerio';

interface ScrapedArticle {
  body: string;
  author: string | null;
  publishedAt: string | null;
}

/**
 * Fetch an article page and extract full body content.
 * Tries multiple strategies: site-specific → generic selectors.
 */
export async function scrapeArticle(url: string): Promise<ScrapedArticle | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OmniFlowAI/1.0 News Crawler' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract JSON-LD metadata first
    let jsonAuthor: string | null = null;
    let jsonDate: string | null = null;

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).text());
        if (data['@type'] === 'NewsArticle' || data['@type'] === 'Article') {
          if (data.author?.name) jsonAuthor = data.author.name;
          else if (typeof data.author === 'string') jsonAuthor = data.author;
          if (data.datePublished) jsonDate = data.datePublished;
        }
      } catch { /* skip invalid JSON */ }
    });

    // Try site-specific selectors first, then generic
    const bodySelectors = [
      'article.fck_detail',        // VNExpress
      '.article-body',
      '.article-content',
      '.post-content',
      '.entry-content',
      '[itemprop="articleBody"]',
      'article',
      '.content',
    ];

    let bodyHtml = '';
    for (const sel of bodySelectors) {
      const el = $(sel);
      if (el.length > 0) {
        bodyHtml = el.html() ?? '';
        break;
      }
    }

    if (!bodyHtml) return null;

    // Convert HTML to clean text
    const body = cheerio
      .load(bodyHtml)('body')
      .text()
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!body || body.length < 50) return null;

    return {
      body,
      author: jsonAuthor,
      publishedAt: jsonDate,
    };
  } catch {
    return null;
  }
}

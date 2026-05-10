import { createServiceSupabase } from '@/lib/supabase/server';
import { generateBatchForAutoPublish } from '@/services/content/generator';
import { publishToFacebookPage } from '@/services/social/facebook';

const TAG = '[OmniFlow AutoPublish]';

interface PublishableArticle {
  id: string;
  source_id: string;
  title: string;
  body: string;
  url: string;
  image_url?: string;
}

interface SourceConfig {
  name: string;
  auto_publish_platform: string;
  auto_publish_tone: string;
}

interface PublishResult {
  articleId: string;
  title: string;
  platform: string;
  success: boolean;
  error?: string;
  platformPostId?: string;
}

export async function autoPublishNewArticles(
  newArticles: PublishableArticle[],
  sources: Record<string, SourceConfig>,
): Promise<{ published: number; failed: number; results: PublishResult[] }> {
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let published = 0;
  let failed = 0;
  const results: PublishResult[] = [];

  // Filter articles that have a source config
  const validArticles = newArticles.filter((a) => sources[a.source_id]);
  if (validArticles.length === 0) {
    console.log(`${TAG} No articles with valid auto-publish sources.`);
    return { published: 0, failed: 0, results: [] };
  }

  // Batch-generate all posts in ONE API call
  console.log(`${TAG} Batch generating posts for ${validArticles.length} articles...`);
  // Build a lookup for image URLs
  const imageLookup: Record<string, string | undefined> = {};
  for (const a of validArticles) {
    imageLookup[a.id] = (a as any).metadata?.image_url || a.image_url || undefined;
  }

  const posts = await generateBatchForAutoPublish(
    validArticles.map((a) => ({
      title: a.title,
      body: a.body,
      url: a.url,
      source: sources[a.source_id].name,
      tone: sources[a.source_id].auto_publish_tone || 'professional',
    })),
  );

  // Publish each article (matched by index from batch response)
  for (let i = 0; i < validArticles.length; i++) {
    const article = validArticles[i];
    const cfg = sources[article.source_id];
    const socialContent = posts[i] ?? null;

    console.log(`${TAG} Publishing: "${article.title.slice(0, 60)}..." [source=${cfg.name}]`);

    if (!socialContent) {
      failed++;
      console.log(`${TAG}   FAILED: no generated content (index ${i}).`);
      results.push({ articleId: article.id, title: article.title, platform: cfg.auto_publish_platform, success: false, error: 'No generated content' });
      continue;
    }
    console.log(`${TAG}   Content: ${socialContent.length} chars.`);

    if (cfg.auto_publish_platform === 'facebook') {
      // Read FB creds from DB (set via Settings page)
      const { data: fbCreds } = await db
        .from('social_credentials')
        .select('access_token, page_id')
        .eq('platform', 'facebook')
        .limit(1)
        .single();

      const pageAccessToken = fbCreds?.access_token;
      const pageId = fbCreds?.page_id;

      console.log(`${TAG}   FB creds: token=${pageAccessToken ? 'SET (from DB)' : 'NOT SET'}, pageId=${pageId || 'NOT SET'}`);

      if (!pageAccessToken || !pageId) {
        failed++;
        console.log(`${TAG}   FAILED: Facebook credentials not configured. Set in Settings → Facebook Page.`);
        results.push({ articleId: article.id, title: article.title, platform: 'facebook', success: false, error: 'Facebook credentials not configured' });
        continue;
      }

      const imageUrl = imageLookup[article.id];
      const fbResult = await publishToFacebookPage({ pageAccessToken, pageId, message: socialContent, imageUrl });

      if (fbResult.success) {
        await db.from('published_articles').insert({
          article_id: article.id,
          platform: 'facebook',
          platform_post_id: fbResult.platformPostId,
        });
        // Also save to contents for insights tracking
        try {
          await db.from('contents').insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            title: article.title,
            body: socialContent,
            content_type: 'social_fb',
            status: 'published',
            platform_post_id: fbResult.platformPostId,
            metadata: {
              published_at: new Date().toISOString(),
              permalink_url: `https://www.facebook.com/${fbResult.platformPostId}`,
              platform: 'facebook',
            },
          });
        } catch (dbErr) {
          console.error(`${TAG} Failed to save to contents:`, dbErr);
        }
        published++;
        console.log(`${TAG}   SUCCESS: postId=${fbResult.platformPostId}`);
        results.push({ articleId: article.id, title: article.title, platform: 'facebook', success: true, platformPostId: fbResult.platformPostId });
      } else {
        failed++;
        console.log(`${TAG}   FAILED: ${fbResult.error}`);
        results.push({ articleId: article.id, title: article.title, platform: 'facebook', success: false, error: fbResult.error });
      }
    } else {
      failed++;
      console.log(`${TAG}   FAILED: platform "${cfg.auto_publish_platform}" not supported.`);
      results.push({ articleId: article.id, title: article.title, platform: cfg.auto_publish_platform, success: false, error: `Unsupported platform: ${cfg.auto_publish_platform}` });
    }
  }

  console.log(`${TAG} Done: ${published} published, ${failed} failed.`);
  return { published, failed, results };
}

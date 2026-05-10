/**
 * Facebook Page publishing connector.
 * Uses Meta Graph API to post to a Facebook Page.
 *
 * Quick setup (for testing):
 *   1. Go to https://developers.facebook.com/tools/explorer/
 *   2. Select your App → Get User Token with pages_manage_posts permission
 *   3. Click "Get Page Access Token" → copy the token
 *   4. Get your Page ID from: GET /me/accounts
 *
 * Production setup:
 *   1. Create Meta App at https://developers.facebook.com/
 *   2. Configure Facebook Login → get App ID + App Secret
 *   3. Implement OAuth 2.0 flow for long-lived tokens
 */

const GRAPH_API = 'https://graph.facebook.com/v22.0';

export interface FacebookPublishParams {
  pageAccessToken: string;
  pageId: string;
  message: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export interface FacebookResult {
  success: boolean;
  platformPostId?: string;
  platform: string;
  error?: string;
}

/**
 * Publish a text post to a Facebook Page feed.
 * Multiple images → each published as separate photo post with same caption.
 */
export async function publishToFacebookPage({
  pageAccessToken,
  pageId,
  message,
  imageUrl,
  imageUrls,
}: FacebookPublishParams): Promise<FacebookResult> {
  const allImages = imageUrls?.filter(Boolean) || (imageUrl ? [imageUrl] : []);

  // No images → plain text post
  if (allImages.length === 0) {
    console.log(`[OmniFlow FB] Publishing text post to page ${pageId}, ${message.length} chars...`);
    try {
      const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: pageAccessToken, message }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        console.log(`[OmniFlow FB] FAILED:`, data.error);
        return { success: false, platform: 'facebook', error: data.error?.message ?? `Graph API error ${res.status}` };
      }
      return { success: true, platform: 'facebook', platformPostId: data.id };
    } catch (err) {
      return { success: false, platform: 'facebook', error: err instanceof Error ? err.message : 'Network error' };
    }
  }

  // Single image → simple /photos post
  if (allImages.length === 1) {
    const imgUrl = allImages[0];
    console.log(`[OmniFlow FB] Publishing photo post to page ${pageId}, image=${imgUrl.slice(0, 60)}...`);
    try {
      const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: pageAccessToken, url: imgUrl, caption: message }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        console.log(`[OmniFlow FB] FAILED:`, data.error);
        return { success: false, platform: 'facebook', error: data.error?.message ?? `Graph API error ${res.status}` };
      }
      return { success: true, platform: 'facebook', platformPostId: data.id };
    } catch (err) {
      return { success: false, platform: 'facebook', error: err instanceof Error ? err.message : 'Network error' };
    }
  }

  // Multiple images → publish each as separate photo post (most reliable)
  console.log(`[OmniFlow FB] Publishing ${allImages.length} photo posts to page ${pageId}...`);
  let lastId: string | null = null;
  for (const url of allImages) {
    try {
      console.log(`[OmniFlow FB] Posting photo: ${url.slice(0, 60)}...`);
      const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: pageAccessToken, url, caption: message }),
      });
      const data = await res.json();
      if (data.id) {
        lastId = data.id;
        console.log(`[OmniFlow FB] Photo posted: ${data.id}`);
      } else {
        console.log(`[OmniFlow FB] Photo post failed:`, data.error);
      }
    } catch (err) {
      console.log(`[OmniFlow FB] Photo post network error for ${url.slice(0, 60)}:`, err);
    }
  }
  if (lastId) {
    return { success: true, platform: 'facebook', platformPostId: lastId };
  }
  return { success: false, platform: 'facebook', error: 'Failed to publish any images' };
}

/**
 * Test if a Page Access Token is valid and get page info.
 */
export async function testFacebookConnection(
  pageAccessToken: string,
  pageId: string,
): Promise<{ ok: boolean; pageName?: string; error?: string }> {
  try {
    const res = await fetch(
      `${GRAPH_API}/${pageId}?fields=name&access_token=${encodeURIComponent(pageAccessToken)}`,
    );
    const data = await res.json();

    if (data.error) {
      return { ok: false, error: data.error.message };
    }

    return { ok: true, pageName: data.name };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export interface PostInsights {
  id: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagedUsers: number;
  reactions: Record<string, number>;
  createdTime: string;
  message: string;
  permalinkUrl: string;
}

export async function getPostInsights(
  postId: string,
  pageAccessToken: string,
): Promise<PostInsights | null> {
  try {
    const fields = [
      'likes.summary(true)',
      'comments.summary(true)',
      'shares',
      'reactions.summary(true)',
      'insights.metric(post_impressions,post_engaged_users,post_reactions_by_type_total)',
      'message',
      'created_time',
      'permalink_url',
    ].join(',');

    const res = await fetch(
      `${GRAPH_API}/${postId}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(pageAccessToken)}`,
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      console.log(`[OmniFlow FB] Post insights failed for ${postId}:`, data.error);
      return null;
    }

    return {
      id: data.id || postId,
      likes: data.likes?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
      impressions: data.insights?.data?.find((i: any) => i.name === 'post_impressions')?.values?.[0]?.value || 0,
      engagedUsers: data.insights?.data?.find((i: any) => i.name === 'post_engaged_users')?.values?.[0]?.value || 0,
      reactions: data.reactions?.summary?.total_count ? { total: data.reactions.summary.total_count } : {},
      createdTime: data.created_time || '',
      message: data.message || '',
      permalinkUrl: data.permalink_url || '',
    };
  } catch (err) {
    console.log(`[OmniFlow FB] Post insights error:`, err);
    return null;
  }
}

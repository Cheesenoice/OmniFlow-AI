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
}

export interface FacebookResult {
  success: boolean;
  platformPostId?: string;
  platform: string;
  error?: string;
}

/**
 * Publish a text post to a Facebook Page feed.
 */
export async function publishToFacebookPage({
  pageAccessToken,
  pageId,
  message,
}: FacebookPublishParams): Promise<FacebookResult> {
  try {
    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: pageAccessToken,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        platform: 'facebook',
        error: data.error?.message ?? `Graph API error ${res.status}`,
      };
    }

    return {
      success: true,
      platform: 'facebook',
      platformPostId: data.id,
    };
  } catch (err) {
    return {
      success: false,
      platform: 'facebook',
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
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
      `${GRAPH_API}/${pageId}?fields=name&access_token=${pageAccessToken}`,
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

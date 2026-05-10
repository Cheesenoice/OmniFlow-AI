import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { getPostInsights, type PostInsights } from '@/services/social/facebook';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accessToken = searchParams.get('token') || undefined;

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get all published Facebook posts
  const { data: contents, error } = await db
    .from('contents')
    .select('*')
    .eq('content_type', 'social_fb')
    .eq('status', 'published')
    .not('platform_post_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Try to get Facebook token: query param > social_credentials table
  let fbToken: string | null = accessToken || null;
  if (!fbToken) {
    try {
      const { data: creds } = await db
        .from('social_credentials')
        .select('access_token')
        .eq('platform', 'facebook')
        .single();
      fbToken = creds?.access_token || null;
    } catch { /* no server-side token */ }
  }

  let tokenMissing = !fbToken;

  const posts = await Promise.all(
    (contents || []).map(async (c: any) => {
      const cachedInsights = c.metadata?.insights;
      const cacheAge = cachedInsights?.updated_at
        ? Date.now() - new Date(cachedInsights.updated_at).getTime()
        : Infinity;

      // Fetch fresh insights if token available and cache older than 5 min
      let insights: PostInsights | null = null;
      if (fbToken && c.platform_post_id && cacheAge > 300_000) {
        insights = await getPostInsights(c.platform_post_id, fbToken);
        if (insights) {
          const updated = {
            ...(c.metadata || {}),
            insights: {
              likes: insights.likes,
              comments: insights.comments,
              shares: insights.shares,
              impressions: insights.impressions,
              engagedUsers: insights.engagedUsers,
              reactions: insights.reactions,
              updated_at: new Date().toISOString(),
            },
          };
          await db.from('contents').update({ metadata: updated }).eq('id', c.id);
        }
      }

      const displayInsights = insights
        ? {
            likes: insights.likes,
            comments: insights.comments,
            shares: insights.shares,
            impressions: insights.impressions,
            engagedUsers: insights.engagedUsers,
            reactions: insights.reactions,
          }
        : cachedInsights
          ? {
              likes: cachedInsights.likes || 0,
              comments: cachedInsights.comments || 0,
              shares: cachedInsights.shares || 0,
              impressions: cachedInsights.impressions || 0,
              engagedUsers: cachedInsights.engagedUsers || 0,
              reactions: cachedInsights.reactions || {},
            }
          : null;

      return {
        id: c.id,
        title: c.title || 'Untitled',
        body: c.body,
        platform_post_id: c.platform_post_id,
        created_at: c.created_at,
        published_at: c.metadata?.published_at || c.created_at,
        permalink_url: c.metadata?.permalink_url || null,
        insights: displayInsights,
      };
    }),
  );

  return NextResponse.json({ posts, tokenMissing });
}

export const runtime = 'nodejs';

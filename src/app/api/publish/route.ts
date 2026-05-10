import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { publishToTelegram } from '@/services/social/telegram';
import { publishToFacebookPage } from '@/services/social/facebook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, content, title, botToken, chatId, pageAccessToken, pageId, imageUrl, imageUrls } = body;

    const supabase = createServiceSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    if (!platform || !content) {
      return NextResponse.json({ error: 'platform and content are required' }, { status: 400 });
    }

    // Telegram: direct bot token + chat ID (localStorage)
    if (platform === 'telegram') {
      if (!botToken || !chatId) {
        return NextResponse.json(
          { success: false, platform, error: 'botToken and chatId required. Save credentials in Settings first.' },
          { status: 400 },
        );
      }

      const result = await publishToTelegram({
        botToken,
        chatId,
        content: title ? `*${escapeMarkdown(title)}*\n\n${content}` : content,
      });

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // Facebook: direct Page Access Token + Page ID (localStorage)
    if (platform === 'facebook') {
      if (!pageAccessToken || !pageId) {
        return NextResponse.json(
          { success: false, platform, error: 'pageAccessToken and pageId required. Save credentials in Settings first.' },
          { status: 400 },
        );
      }

      const result = await publishToFacebookPage({
        pageAccessToken,
        pageId,
        message: title ? `${title}\n\n${content}` : content,
        imageUrl: imageUrl || undefined,
        imageUrls: imageUrls || undefined,
      });

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      // Save to contents table for insights tracking
      if (result.platformPostId) {
        try {
          const permalinkUrl = `https://www.facebook.com/${result.platformPostId}`;
          await db.from('contents').insert({
            user_id: body.userId || '00000000-0000-0000-0000-000000000000',
            title: title || content.slice(0, 100),
            body: content,
            content_type: 'social_fb',
            status: 'published',
            platform_post_id: result.platformPostId,
            metadata: { published_at: new Date().toISOString(), permalink_url: permalinkUrl, platform: 'facebook' },
          });
        } catch (dbErr) {
          console.error('[Publish] Failed to save to contents:', dbErr);
          // Non-fatal — post is already on Facebook
        }
      }

      return NextResponse.json(result);
    }

    // Other platforms: not yet implemented
    return NextResponse.json(
      { success: false, platform, error: `${platform} publishing not yet available. Use Telegram or Facebook.` },
      { status: 400 },
    );
  } catch (err) {
    console.error('Publish API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Publish failed' },
      { status: 500 },
    );
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

export const runtime = 'nodejs';

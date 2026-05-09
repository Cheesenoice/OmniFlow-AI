import { NextRequest, NextResponse } from 'next/server';
import { publishToTelegram } from '@/services/social/telegram';
import { publishToFacebookPage } from '@/services/social/facebook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, content, title, botToken, chatId, pageAccessToken, pageId } = body;

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
      });

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
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

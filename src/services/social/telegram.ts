/**
 * Telegram Bot publishing connector.
 *
 * Setup:
 * 1. Create bot with @BotFather → get token
 * 2. Get chat ID: https://api.telegram.org/bot<TOKEN>/getUpdates
 */

import type { PlatformType } from '@/types';

const TELEGRAM_API = 'https://api.telegram.org';

export interface TelegramResult {
  success: boolean;
  platformPostId?: string;
  platform: PlatformType;
  error?: string;
}

export async function publishToTelegram({
  botToken,
  chatId,
  content,
}: {
  botToken: string;
  chatId: string;
  content: string;
}): Promise<TelegramResult> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: content, parse_mode: 'Markdown' }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      return { success: false, platform: 'telegram' as PlatformType, error: data.description ?? `API error ${res.status}` };
    }

    return { success: true, platform: 'telegram' as PlatformType, platformPostId: String(data.result?.message_id) };
  } catch (err) {
    return { success: false, platform: 'telegram' as PlatformType, error: err instanceof Error ? err.message : 'Network error' };
  }
}

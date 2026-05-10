import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { runCrawlPipeline } from '@/services/crawler/runner';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check schedule
  const { data: schedule } = await db
    .from('crawl_schedules')
    .select('*')
    .limit(1)
    .single();

  if (!schedule || !schedule.enabled) {
    return NextResponse.json({ status: 'disabled', message: 'Schedule not configured or disabled' });
  }

  const now = new Date();
  const lastTriggered = schedule.last_triggered_at ? new Date(schedule.last_triggered_at) : null;

  let shouldCrawl = false;

  switch (schedule.schedule_mode) {
    case 'interval': {
      const intervalMs = (schedule.interval_minutes || 10) * 60 * 1000;
      shouldCrawl = !lastTriggered || (now.getTime() - lastTriggered.getTime()) >= intervalMs;
      break;
    }
    case 'daily': {
      const [h, m] = (schedule.daily_time || '08:00:00').split(':').map(Number);
      const todayTarget = new Date(now);
      todayTarget.setHours(h, m, 0, 0);
      shouldCrawl = now >= todayTarget && (!lastTriggered || lastTriggered < todayTarget);
      break;
    }
    case 'weekly': {
      const day = schedule.weekly_day || 1;
      const currentDay = now.getDay() || 7;
      if (currentDay !== day) break;
      const [h, m] = (schedule.weekly_time || '08:00:00').split(':').map(Number);
      const todayTarget = new Date(now);
      todayTarget.setHours(h, m, 0, 0);
      shouldCrawl = now >= todayTarget && (!lastTriggered || lastTriggered < todayTarget);
      break;
    }
    case 'monthly': {
      const dom = schedule.monthly_day || 1;
      if (now.getDate() !== dom) break;
      const [h, m] = (schedule.monthly_time || '08:00:00').split(':').map(Number);
      const todayTarget = new Date(now);
      todayTarget.setHours(h, m, 0, 0);
      shouldCrawl = now >= todayTarget && (!lastTriggered || lastTriggered < todayTarget);
      break;
    }
  }

  if (!shouldCrawl) {
    return NextResponse.json({ status: 'skipped', message: 'Not time yet' });
  }

  const result = await runCrawlPipeline();
  return NextResponse.json({ status: 'crawled', ...result });
}

export const runtime = 'nodejs';

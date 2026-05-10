import { createServiceSupabase } from '@/lib/supabase/server';
import { runCrawlPipeline } from './runner';

let running = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the background crawl scheduler.
 * Runs independently of browser clients — as long as the Next.js server is alive.
 * Idempotent: calling multiple times has no effect.
 */
export function startCrawlScheduler() {
  if (running) return;
  running = true;

  const CHECK_INTERVAL_MS = 30_000; // check every 30 seconds

  const tick = async () => {
    try {
      const supabase = createServiceSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      // Get schedule
      const { data: schedule } = await db
        .from('crawl_schedules')
        .select('*')
        .limit(1)
        .single();

      if (!schedule || !schedule.enabled) {
        return; // No schedule or disabled — nothing to do
      }

      const now = new Date();
      const lastTriggered = schedule.last_triggered_at ? new Date(schedule.last_triggered_at) : null;

      let shouldRun = false;

      if (schedule.schedule_mode === 'interval') {
        const intervalMs = (schedule.interval_minutes || 10) * 60 * 1000;
        shouldRun = !lastTriggered || (now.getTime() - lastTriggered.getTime()) >= intervalMs;
      } else {
        // For daily/weekly/monthly — check the cron endpoint logic
        const [h, m] = (schedule.schedule_mode === 'daily'
          ? (schedule.daily_time || '08:00:00').split(':').map(Number)
          : schedule.schedule_mode === 'weekly'
            ? (schedule.weekly_time || '08:00:00').split(':').map(Number)
            : (schedule.monthly_time || '08:00:00').split(':').map(Number));

        const todayTarget = new Date(now);
        todayTarget.setHours(h, m, 0, 0);

        if (schedule.schedule_mode === 'weekly') {
          const day = schedule.weekly_day || 1;
          const currentDay = now.getDay() || 7;
          if (currentDay !== day) return;
        }
        if (schedule.schedule_mode === 'monthly') {
          const dom = schedule.monthly_day || 1;
          if (now.getDate() !== dom) return;
        }

        shouldRun = now >= todayTarget && (!lastTriggered || lastTriggered < todayTarget);
      }

      if (shouldRun) {
        console.log('[OmniFlow Scheduler] Time to crawl! Starting pipeline...');
        const result = await runCrawlPipeline();
        console.log(`[OmniFlow Scheduler] Pipeline done: ${result.crawl.articles_new} new, ${result.publish?.published ?? 0} published, emailSent=${result.emailSent}`);
      }
    } catch (err) {
      console.error('[OmniFlow Scheduler] Error:', err instanceof Error ? err.message : String(err));
    }
  };

  // Run immediately on start (first check)
  tick();

  // Then check every 30s
  intervalId = setInterval(tick, CHECK_INTERVAL_MS);
}

/**
 * Stop the scheduler (for testing/cleanup).
 */
export function stopCrawlScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
}

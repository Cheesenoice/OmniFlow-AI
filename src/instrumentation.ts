/**
 * Next.js Instrumentation — registers background tasks on server start.
 * The crawl scheduler runs independently of any browser/client.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCrawlScheduler } = await import('@/services/crawler/scheduler');
    startCrawlScheduler();
    console.log('[OmniFlow Scheduler] Background crawl scheduler started.');
  }
}

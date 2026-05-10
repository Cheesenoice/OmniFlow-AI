'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Newspaper,
  ExternalLink,
  Sparkles,
  Calendar,
  Rss,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  Globe,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Layers,
  Timer,
  Rocket,
  FlaskConical,
} from 'lucide-react';
import type { CrawledArticle } from '@/types';

// Clean modern source color palette
const SOURCE_COLORS: Record<string, string> = {
  'Thế giới': 'bg-indigo-500',
  'Kinh doanh': 'bg-emerald-500',
  'Thời sự': 'bg-amber-500',
  'Giải trí': 'bg-violet-500',
  'Số Hoá': 'bg-sky-500',
  'Tin Mới': 'bg-rose-500',
};

function getSourceColor(name: string): string {
  for (const [key, color] of Object.entries(SOURCE_COLORS)) {
    if (name.includes(key) || key.includes(name)) return color;
  }
  return 'bg-slate-500';
}

function getSourceBorderColor(name: string): string {
  const bg = getSourceColor(name);
  return bg.replace('bg-', 'border-');
}

interface Stats {
  total: number;
  today: number;
  sourcesCount: number;
  bySource: Record<string, number>;
  lastCrawledAt: string | null;
  isFullyCrawled: boolean;
  missingSources: string[];
}

export default function NewsPage() {
  const [articles, setArticles] = useState<CrawledArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [crawlingSource, setCrawlingSource] = useState<string | null>(null);
  const [crawlMsg, setCrawlMsg] = useState<{ type: string; text: string } | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<CrawledArticle | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0, today: 0, sourcesCount: 0, bySource: {},
    lastCrawledAt: null, isFullyCrawled: false, missingSources: [],
  });
  const limit = 24;

  // Schedule & countdown
  interface SchedConfig { schedule_mode: string; interval_minutes: number; daily_time: string; weekly_day: number; weekly_time: string; monthly_day: number; monthly_time: string; enabled: boolean; last_triggered_at: string | null; }
  const [sched, setSched] = useState<SchedConfig | null>(null);
  const [countdown, setCountdown] = useState({ min: 0, sec: 0, pct: 0 });
  const [autoPublishSources, setAutoPublishSources] = useState<{ name: string; tone: string }[]>([]);

  const fetchSched = useCallback(async () => {
    try {
      const res = await fetch('/api/crawl/schedule');
      const data = await res.json();
      if (res.ok && data.schedule) setSched(data.schedule);
    } catch { /* ignore */ }
  }, []);

  const fetchAutoPublishSources = useCallback(async () => {
    try {
      const res = await fetch('/api/crawl/sources');
      const data = await res.json();
      if (res.ok) {
        setAutoPublishSources(
          (data.sources ?? [])
            .filter((s: any) => s.auto_publish)
            .map((s: any) => ({ name: s.name, tone: s.auto_publish_tone })),
        );
      }
    } catch { /* ignore */ }
  }, []);

  const fetchArticles = useCallback(async (p: number, s: string, src: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (s) params.set('search', s);
      if (src) params.set('source', src);
      const res = await fetch(`/api/crawl/articles?${params}`);
      const data = await res.json();
      if (res.ok) {
        setArticles(data.articles ?? []);
        setTotal(data.total ?? 0);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/crawl/sources');
      const data = await res.json();
      if (res.ok) setSources((data.sources ?? []).map((s: { name: string }) => s.name));
    } catch { /* ignore */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/crawl/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchArticles(page, search, selectedSource);
  }, [page, search, selectedSource, fetchArticles]);

  useEffect(() => {
    fetchSources();
    fetchStats();
    fetchSched();
    fetchAutoPublishSources();
  }, [fetchSources, fetchStats, fetchSched, fetchAutoPublishSources]);

  // Keep schedule + stats in sync with server scheduler (every 30s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchSched();
      fetchStats();
    }, 30_000);
    return () => clearInterval(timer);
  }, [fetchSched, fetchStats]);

  const handleCrawl = async (source: string | null) => {
    setCrawling(true);
    setCrawlingSource(source);
    setCrawlMsg({ type: 'info', text: source ? `Đang cào ${source}...` : 'Đang cào tất cả nguồn...' });
    try {
      const res = await fetch('/api/crawl/trigger', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        const c = data.crawl;
        const p = data.publish;
        let msg = `Cào xong: ${c.articles_new} bài mới, ${c.articles_skipped} đã bỏ qua từ ${c.sources_crawled} nguồn.`;
        if (p && p.published > 0) msg += ` Đã đăng ${p.published} bài.`;
        if (p && p.failed > 0) msg += ` ${p.failed} bài lỗi đăng.`;
        if (data.emailSent) msg += ' Đã gửi mail.';
        setCrawlMsg({ type: 'success', text: msg });
        fetchArticles(1, search, selectedSource);
        fetchStats();
        fetchSched(); // refresh countdown
      } else {
        setCrawlMsg({ type: 'error', text: data.error ?? 'Có lỗi xảy ra.' });
      }
    } catch {
      setCrawlMsg({ type: 'error', text: 'Không thể kết nối đến server.' });
    } finally {
      setCrawling(false);
      setCrawlingSource(null);
      setTimeout(() => setCrawlMsg(null), 6000);
    }
  };

  // Test publish: takes 1 recent article per source and publishes to test
  const [testPublishing, setTestPublishing] = useState(false);
  const testPublish = async () => {
    setTestPublishing(true);
    setCrawlMsg({ type: 'info', text: 'Đang test publish với bài có sẵn... (gọi 1 API batch, đăng Facebook, gửi mail)' });
    try {
      const res = await fetch('/api/crawl/test-publish', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.publish) {
        const p = data.publish;
        const msg = `Test publish: ${p.published} bài đã đăng, ${p.failed} lỗi.${data.emailSent ? ' Đã gửi mail.' : ''}`;
        setCrawlMsg({ type: p.published > 0 ? 'success' : 'error', text: msg });
        fetchStats();
      } else {
        setCrawlMsg({ type: 'error', text: data.error ?? 'Test publish failed.' });
      }
    } catch {
      setCrawlMsg({ type: 'error', text: 'Không thể kết nối đến server.' });
    } finally {
      setTestPublishing(false);
      setTimeout(() => setCrawlMsg(null), 8000);
    }
  };

  // Countdown ticker
  useEffect(() => {
    if (!sched?.enabled || sched.schedule_mode !== 'interval') return;

    const intervalMs = (sched.interval_minutes || 10) * 60000;

    const calc = () => {
      // If never triggered, show ready (00:00)
      if (!sched.last_triggered_at) {
        setCountdown({ min: 0, sec: 0, pct: 100 });
        if (!crawling) handleCrawl(null);
        return;
      }

      const last = new Date(sched.last_triggered_at).getTime();
      const next = last + intervalMs;
      const remaining = Math.max(0, next - Date.now());

      setCountdown({
        min: Math.floor(remaining / 60000),
        sec: Math.floor((remaining % 60000) / 1000),
        pct: Math.max(0, Math.min(100, Math.round(((intervalMs - remaining) / intervalMs) * 100))),
      });

      if (remaining <= 0 && remaining > -3000 && !crawling) {
        handleCrawl(null);
      }
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [sched, crawling]);

  const deleteArticle = async (id: string) => {
    try {
      await fetch(`/api/crawl/articles?id=${id}`, { method: 'DELETE' });
      if (selectedArticle?.id === id) setSelectedArticle(null);
      fetchArticles(page, search, selectedSource);
      fetchStats();
    } catch { /* ignore */ }
  };

  const useForGeneration = (article: CrawledArticle) => {
    sessionStorage.setItem('omni_crawled_article', JSON.stringify({
      title: article.title,
      body: article.body,
      url: article.url,
      source: (article as any).crawl_sources?.name ?? 'Unknown',
    }));
    window.location.href = '/dashboard';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const truncate = (text: string, max: number) => {
    if (!text) return '';
    return text.length <= max ? text : text.slice(0, max) + '…';
  };

  const sourceName = (article: CrawledArticle) =>
    (article as any).crawl_sources?.name ?? 'Unknown';

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">News Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý tin tức đã cào từ các nguồn RSS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => { fetchArticles(page, search, selectedSource); fetchStats(); }}
          >
            <RefreshCw className="size-3.5" />
            Làm mới
          </Button>
          <Button
            onClick={() => handleCrawl(null)}
            disabled={crawling}
            size="sm"
            className="gap-1.5"
          >
            {crawling && crawlingSource === null ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Rss className="size-3.5" />
            )}
            {crawling && crawlingSource === null ? 'Đang cào...' : 'Cào tất cả'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20"
            onClick={testPublish}
            disabled={testPublishing}
          >
            {testPublishing ? <Loader2 className="size-3.5 animate-spin" /> : <FlaskConical className="size-3.5" />}
            Test Publish
          </Button>
        </div>
      </div>

      {/* Countdown + Schedule Banner */}
      {sched?.enabled && sched.schedule_mode === 'interval' && (
        <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-4 text-sm">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Timer className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">
              Next crawl in <span className="tabular-nums text-primary font-mono">{String(countdown.min).padStart(2, '0')}:{String(countdown.sec).padStart(2, '0')}</span>
            </p>
            <p className="text-xs text-muted-foreground">Interval: mỗi {sched.interval_minutes} phút</p>
          </div>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0 hidden sm:block">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${countdown.pct}%` }}
            />
          </div>
        </div>
      )}

      {sched?.enabled && sched.schedule_mode !== 'interval' && (
        <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3 text-sm">
          <Timer className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium">Next crawl: </span>
            {sched.schedule_mode === 'daily' && <span className="text-muted-foreground">Hàng ngày lúc {sched.daily_time?.slice(0, 5)}</span>}
            {sched.schedule_mode === 'weekly' && <span className="text-muted-foreground">Thứ {sched.weekly_day} lúc {sched.weekly_time?.slice(0, 5)}</span>}
            {sched.schedule_mode === 'monthly' && <span className="text-muted-foreground">Ngày {sched.monthly_day} hàng tháng lúc {sched.monthly_time?.slice(0, 5)}</span>}
          </div>
        </div>
      )}

      {/* Auto-Publish Status Banner */}
      {autoPublishSources.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/10 px-4 py-3 flex items-center gap-3 text-sm">
          <Rocket className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-emerald-700 dark:text-emerald-400">Auto Publish đang bật cho: </span>
            {autoPublishSources.map((s, i) => (
              <span key={s.name} className="text-muted-foreground">
                {s.name}<span className="text-xs text-muted-foreground/70"> ({s.tone})</span>
                {i < autoPublishSources.length - 1 && ', '}
              </span>
            ))}
          </div>
          <CheckCircle2 className="size-4 text-emerald-500 shrink-0 hidden sm:block" />
        </div>
      )}

      {/* Crawl Status Banner */}
      {stats.sourcesCount > 0 && !crawlMsg && (
        <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 text-sm ${
          stats.isFullyCrawled
            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
            : 'border-amber-200 bg-amber-50/50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
        }`}>
          {stats.isFullyCrawled ? (
            <CheckCircle2 className="size-5 shrink-0" />
          ) : (
            <AlertCircle className="size-5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="font-medium">
              {stats.isFullyCrawled ? 'Đã cào đầy đủ hôm nay' : 'Chưa cào đầy đủ hôm nay'}
            </span>
            <span className="ml-2 text-muted-foreground">
              • {stats.today} bài hôm nay
              {stats.missingSources.length > 0 && (
                <span> • Thiếu: {stats.missingSources.join(', ')}</span>
              )}
            </span>
          </div>
          {!stats.isFullyCrawled && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => handleCrawl(null)}
              disabled={crawling}
            >
              {crawling ? 'Đang cào...' : 'Cào ngay'}
            </Button>
          )}
        </div>
      )}

      {/* Crawl Progress Message */}
      {crawlMsg && (
        <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 text-sm ${
          crawlMsg.type === 'success'
            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' :
          crawlMsg.type === 'error'
            ? 'border-red-200 bg-red-50/50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400' :
          'border-blue-200 bg-blue-50/50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-400'
        }`}>
          {crawlMsg.type === 'info' && <Loader2 className="size-4 animate-spin shrink-0" />}
          {crawlMsg.type === 'success' && <CheckCircle2 className="size-4 shrink-0" />}
          {crawlMsg.type === 'error' && <AlertCircle className="size-4 shrink-0" />}
          {crawlMsg.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-muted/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Tổng bài viết</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{stats.today}</p>
              <p className="text-xs text-muted-foreground">Bài hôm nay</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Globe className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{stats.sourcesCount}</p>
              <p className="text-xs text-muted-foreground">Nguồn RSS</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <RefreshCw className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold tabular-nums">
                {stats.lastCrawledAt ? formatTime(stats.lastCrawledAt) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Cào lần cuối</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crawl Controls */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Điều khiển Cào Dữ liệu</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => handleCrawl(null)}
              disabled={crawling}
              size="sm"
              className="gap-1.5"
            >
              {crawling && crawlingSource === null ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Rss className="size-3.5" />
              )}
              Cào tất cả nguồn
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {sources.map((src) => (
              <Button
                key={src}
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleCrawl(src)}
                disabled={crawling}
                style={{ borderColor: `var(--color)` }}
              >
                <span className={`size-2 rounded-full ${getSourceColor(src)}`} />
                {crawling && crawlingSource === src ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Đang cào...
                  </>
                ) : (
                  src
                )}
              </Button>
            ))}
          </div>

          {crawlMsg && (
            <div className={`rounded-md px-3 py-2 text-xs flex items-center gap-2 ${
              crawlMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' :
              crawlMsg.type === 'error' ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400' :
              'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
            }`}>
              {crawlMsg.type === 'info' && <Loader2 className="size-3 animate-spin" />}
              {crawlMsg.text}
            </div>
          )}

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="size-3" />
            Hệ thống sẽ tự động kiểm tra và bỏ qua các bài đã cào trước đó.
          </p>
        </CardContent>
      </Card>

      {/* Source Distribution Bars */}
      {Object.keys(stats.bySource).length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Phân bố bài viết theo nguồn</h2>
            </div>
            <div className="space-y-2">
              {Object.entries(stats.bySource)
                .sort(([, a], [, b]) => b - a)
                .map(([name, count]) => {
                  const maxCount = Math.max(...Object.values(stats.bySource));
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-24 text-xs text-muted-foreground truncate shrink-0">{name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getSourceColor(name)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 flex-wrap">
            <Button
              variant={selectedSource === '' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full h-8"
              onClick={() => { setSelectedSource(''); setPage(1); }}
            >
              Tất cả
              {selectedSource === '' && total > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{total}</Badge>
              )}
            </Button>
            {sources.map((src) => {
              const count = stats.bySource[src] ?? 0;
              return (
                <Button
                  key={src}
                  variant={selectedSource === src ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-full h-8"
                  onClick={() => { setSelectedSource(src); setPage(1); }}
                >
                  <span className={`size-2 rounded-full mr-1.5 ${getSourceColor(src)}`} />
                  {src}
                  {selectedSource === src && count > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{count}</Badge>
                  )}
                </Button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              className="pl-9 rounded-full h-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          {selectedSource || 'Tất cả bài viết'}
        </h2>
        <Badge variant="secondary" className="rounded-full">{total} bài viết</Badge>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-40 w-full rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Newspaper className="size-7 text-muted-foreground/50" />
            </div>
            <h3 className="font-medium text-muted-foreground">Chưa có bài viết nào</h3>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
              {search
                ? 'Không tìm thấy kết quả phù hợp. Thử từ khóa khác.'
                : sources.length === 0
                  ? 'Thêm nguồn RSS trong Trang Cài đặt và bấm "Cào tất cả" để bắt đầu.'
                  : 'Bấm "Cào tất cả" để bắt đầu thu thập tin tức.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => {
              const src = sourceName(article);
              const imgUrl = (article.metadata as any)?.image_url as string | undefined;
              const borderColor = getSourceBorderColor(src);
              return (
                <Card
                  key={article.id}
                  className={`group overflow-hidden cursor-pointer border-l-2 ${borderColor} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                  onClick={() => setSelectedArticle(article)}
                >
                  {imgUrl ? (
                    <div className="h-40 bg-muted relative overflow-hidden">
                      <img
                        src={imgUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <div className="h-2 bg-muted" />
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                        {src}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                      {truncate(article.body, 140)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(article.published_at)}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium text-xs">
                        Đọc thêm →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="size-4" /> Trước
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Sau <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Article Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => { if (!open) setSelectedArticle(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {selectedArticle && (() => {
            const article = selectedArticle;
            const src = sourceName(article);
            const imgUrl = (article.metadata as any)?.image_url as string | undefined;
            return (
              <>
                {imgUrl && (
                  <div className="h-48 sm:h-64 bg-muted overflow-hidden shrink-0">
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                  <DialogHeader className="text-left space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge>{src}</Badge>
                      {article.published_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(article.published_at)}
                        </span>
                      )}
                      {article.author && (
                        <span className="text-xs text-muted-foreground">• {article.author}</span>
                      )}
                    </div>
                    <DialogTitle className="text-lg leading-snug">{article.title}</DialogTitle>
                    {article.url && (
                      <DialogDescription className="text-xs truncate">
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {article.url}
                        </a>
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  <div className="prose prose-sm dark:prose-invert max-w-none mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                    {article.body || 'Không có nội dung. Truy cập link gốc để đọc toàn bộ bài viết.'}
                  </div>
                </div>
                <div className="flex items-center gap-2 px-6 py-4 border-t bg-muted/30 shrink-0">
                  {article.url && (
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <ExternalLink className="size-3.5" /> Xem bài gốc
                      </Button>
                    </a>
                  )}
                  <Button size="sm" className="gap-1.5" onClick={() => useForGeneration(article)}>
                    <Sparkles className="size-3.5" /> Tạo nội dung
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteArticle(article.id)}
                  >
                    <Trash2 className="size-3.5" /> Xóa
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

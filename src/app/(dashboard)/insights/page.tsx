'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Heart, MessageCircle, Share2, Eye, Users,
  RefreshCw, ExternalLink, BarChart3, Loader2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Post {
  id: string;
  title: string;
  body: string;
  platform_post_id: string;
  created_at: string;
  published_at: string;
  permalink_url: string | null;
  insights: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    engagedUsers: number;
    reactions: Record<string, number>;
  } | null;
}

export default function InsightsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  const getFbToken = () => {
    try {
      const saved = localStorage.getItem('omni_facebook');
      if (saved) return JSON.parse(saved).pageAccessToken || null;
    } catch { /* ignore */ }
    return null;
  };

  const fetchPosts = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const token = getFbToken();
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      const res = await fetch(`/api/insights?${params}`);
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
        setTokenMissing(data.tokenMissing || false);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const refreshAll = () => fetchPosts(true);

  const totalLikes = posts.reduce((s, p) => s + (p.insights?.likes || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.insights?.comments || 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.insights?.shares || 0), 0);
  const totalImpressions = posts.reduce((s, p) => s + (p.insights?.impressions || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Xem chỉ số tương tác từ các bài đăng Facebook đã publish.</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={refreshAll} disabled={refreshing}>
          {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      {/* Token missing warning */}
      {tokenMissing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-400">
          Chưa có Facebook token. Vào Settings → Facebook Page để lưu token, sau đó Refresh lại để lấy metrics.
        </div>
      )}

      {/* Stats summary */}
      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Likes', value: totalLikes, icon: <Heart className="size-4" />, color: 'text-red-500' },
            { label: 'Comments', value: totalComments, icon: <MessageCircle className="size-4" />, color: 'text-blue-500' },
            { label: 'Shares', value: totalShares, icon: <Share2 className="size-4" />, color: 'text-green-500' },
            { label: 'Impressions', value: totalImpressions, icon: <Eye className="size-4" />, color: 'text-purple-500' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <span className={s.color}>{s.icon}</span>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Post list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="size-10 text-muted-foreground/30 mb-3" />
            <h3 className="font-medium text-muted-foreground">Chưa có bài đăng nào</h3>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
              Publish bài viết lên Facebook và quay lại đây để xem chỉ số tương tác.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSelected(post)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm line-clamp-1">{post.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {post.body.slice(0, 200)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(post.published_at).toLocaleDateString('vi-VN')}</span>
                      {post.permalink_url && (
                        <a href={post.permalink_url} target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-0.5"
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink className="size-3" /> View
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-3 shrink-0">
                    {post.insights ? (
                      <>
                        <MetricBadge icon={<Heart className="size-3" />} value={post.insights.likes} color="text-red-500" />
                        <MetricBadge icon={<MessageCircle className="size-3" />} value={post.insights.comments} color="text-blue-500" />
                        <MetricBadge icon={<Share2 className="size-3" />} value={post.insights.shares} color="text-green-500" />
                        <MetricBadge icon={<Eye className="size-3" />} value={post.insights.impressions} color="text-purple-500" />
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No data</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base line-clamp-2">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground line-clamp-3">{selected.body.slice(0, 250)}</p>
                {selected.permalink_url && (
                  <a href={selected.permalink_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1">
                    <ExternalLink className="size-3" /> View on Facebook
                  </a>
                )}
                {selected.insights ? (
                  <div className="grid grid-cols-2 gap-3">
                    <MetricBox icon={<Heart className="size-4" />} label="Likes" value={selected.insights.likes} color="text-red-500 bg-red-50 dark:bg-red-950/20" />
                    <MetricBox icon={<MessageCircle className="size-4" />} label="Comments" value={selected.insights.comments} color="text-blue-500 bg-blue-50 dark:bg-blue-950/20" />
                    <MetricBox icon={<Share2 className="size-4" />} label="Shares" value={selected.insights.shares} color="text-green-500 bg-green-50 dark:bg-green-950/20" />
                    <MetricBox icon={<Eye className="size-4" />} label="Impressions" value={selected.insights.impressions} color="text-purple-500 bg-purple-50 dark:bg-purple-950/20" />
                    <MetricBox icon={<Users className="size-4" />} label="Engaged Users" value={selected.insights.engagedUsers} color="text-amber-500 bg-amber-50 dark:bg-amber-950/20" />
                    <MetricBox icon={<TrendingUp className="size-4" />} label="Engagement Rate" value={
                      selected.insights.impressions > 0
                        ? `${((selected.insights.engagedUsers / selected.insights.impressions) * 100).toFixed(2)}%`
                        : 'N/A'
                    } color="text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20" isText />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {tokenMissing
                      ? 'Vào Settings → Facebook Page để lưu token, sau đó Refresh.'
                      : 'No insight data. Click Refresh để lấy metrics từ Facebook.'}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricBox({ icon, label, value, color, isText }: {
  icon: React.ReactNode; label: string; value: number | string; color: string; isText?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 ${color.split(' ')[1] || ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={color.split(' ')[0]}>{icon}</span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{isText ? value : formatNumber(value as number)}</p>
    </div>
  );
}

function MetricBadge({ icon, value, color }: { icon: React.ReactNode; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={color}>{icon}</span>
      <span className="text-xs font-semibold tabular-nums">{formatNumber(value)}</span>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

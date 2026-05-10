'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Key, Check, AlertCircle, Send, Globe, Camera, Hash, Video, Rss, Plus, Trash2, Timer, Rocket, RefreshCw, Mail, Cpu } from 'lucide-react';

export default function SettingsPage() {
  // Telegram
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [tgSaved, setTgSaved] = useState(false);
  const [tgTesting, setTgTesting] = useState(false);
  const [tgResult, setTgResult] = useState<string | null>(null);

  // Facebook
  const [fbToken, setFbToken] = useState('');
  const [fbPageId, setFbPageId] = useState('');
  const [fbSaved, setFbSaved] = useState(false);
  const [fbTesting, setFbTesting] = useState(false);
  const [fbResult, setFbResult] = useState<string | null>(null);

  // RSS Sources
  interface RssSource { id: string; name: string; feed_url: string; max_posts: number; enabled: boolean; last_crawled_at: string | null; auto_publish: boolean; auto_publish_platform: string; auto_publish_tone: string; }
  const [rssSources, setRssSources] = useState<RssSource[]>([]);
  const [rssLoading, setRssLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newMaxPosts, setNewMaxPosts] = useState(10);
  const [rssMsg, setRssMsg] = useState<string | null>(null);

  const fetchRssSources = async () => {
    try {
      const res = await fetch('/api/crawl/sources');
      const data = await res.json();
      if (res.ok) setRssSources(data.sources ?? []);
    } catch { /* ignore */ }
  };

  const addRssSource = async () => {
    if (!newName || !newFeedUrl) return;
    setRssLoading(true); setRssMsg(null);
    try {
      const res = await fetch('/api/crawl/sources', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, feed_url: newFeedUrl, max_posts: newMaxPosts }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewName(''); setNewFeedUrl(''); setNewMaxPosts(10);
        setRssMsg('Source added!');
        fetchRssSources();
      } else { setRssMsg(`Failed: ${data.error}`); }
    } catch { setRssMsg('Network error.'); }
    finally { setRssLoading(false); }
  };

  const toggleRssSource = async (id: string, enabled: boolean) => {
    try {
      await fetch('/api/crawl/sources', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      fetchRssSources();
    } catch { /* ignore */ }
  };

  const deleteRssSource = async (id: string) => {
    try {
      await fetch(`/api/crawl/sources?id=${id}`, { method: 'DELETE' });
      fetchRssSources();
    } catch { /* ignore */ }
  };

  const updateAutoPublish = async (id: string, field: string, value: string | boolean) => {
    try {
      await fetch('/api/crawl/sources', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      fetchRssSources();
    } catch { /* ignore */ }
  };

  // Schedule
  interface ScheduleConfig { id?: string; schedule_mode: string; interval_minutes: number; daily_time: string; weekly_day: number; weekly_time: string; monthly_day: number; monthly_time: string; enabled: boolean; last_triggered_at?: string | null; }
  const [schedule, setSchedule] = useState<ScheduleConfig>({ schedule_mode: 'interval', interval_minutes: 10, daily_time: '08:00:00', weekly_day: 1, weekly_time: '08:00:00', monthly_day: 1, monthly_time: '08:00:00', enabled: false });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/crawl/schedule');
      const data = await res.json();
      if (res.ok && data.schedule) setSchedule(data.schedule);
    } catch { /* ignore */ }
  };

  const saveSchedule = async () => {
    setScheduleLoading(true); setScheduleMsg(null);
    try {
      const res = await fetch('/api/crawl/schedule', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleMsg('Schedule saved!');
        setTimeout(() => setScheduleMsg(null), 3000);
      } else { setScheduleMsg(`Failed: ${data.error}`); }
    } catch { setScheduleMsg('Network error.'); }
    finally { setScheduleLoading(false); }
  };

  // Email settings
  interface EmailConfig { smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass: string; recipient_email: string; notify_on_publish: boolean; }
  const [emailCfg, setEmailCfg] = useState<EmailConfig>({ smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_user: '', smtp_pass: '', recipient_email: '', notify_on_publish: true });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const fetchEmailSettings = async () => {
    try {
      const res = await fetch('/api/crawl/email-settings');
      const data = await res.json();
      if (res.ok && data.settings) setEmailCfg(data.settings);
    } catch { /* ignore */ }
  };

  const saveEmailSettings = async () => {
    setEmailSaving(true); setEmailMsg(null);
    try {
      const res = await fetch('/api/crawl/email-settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailCfg),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailMsg('Email settings saved!');
        setTimeout(() => setEmailMsg(null), 3000);
      } else { setEmailMsg(`Failed: ${data.error}`); }
    } catch { setEmailMsg('Network error.'); }
    finally { setEmailSaving(false); }
  };

  // AI Provider
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiSaving, setAiSaving] = useState(false);
  const fetchAiProvider = async () => {
    try {
      const res = await fetch('/api/settings/ai-provider');
      const data = await res.json();
      if (res.ok && data.config) setAiProvider(data.config.provider);
    } catch { /* ignore */ }
  };

  const saveAiProvider = async (provider: string) => {
    setAiSaving(true);
    try {
      await fetch('/api/settings/ai-provider', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      setAiProvider(provider);
    } catch { /* ignore */ }
    finally { setAiSaving(false); }
  };

  // Load Facebook creds from DB (for auto-publish)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/social-credentials?platform=facebook');
        const data = await res.json();
        if (data.credentials?.access_token) setFbToken(data.credentials.access_token);
        if (data.credentials?.page_id) setFbPageId(data.credentials.page_id);
      } catch { /* ignore */ }
    })();
  }, []);

  // Load all settings
  useEffect(() => { fetchRssSources(); fetchSchedule(); fetchEmailSettings(); fetchAiProvider(); }, []);

  // Load saved
  useEffect(() => {
    const t = localStorage.getItem('omni_telegram');
    if (t) {
      try {
        const p = JSON.parse(t);
        setTgToken(p.botToken ?? ''); setTgChatId(p.chatId ?? ''); setTgSaved(true);
      } catch { /* */ }
    }
    const f = localStorage.getItem('omni_facebook');
    if (f) {
      try {
        const p = JSON.parse(f);
        setFbToken(p.pageAccessToken ?? ''); setFbPageId(p.pageId ?? ''); setFbSaved(true);
      } catch { /* */ }
    }
  }, []);

  const saveTelegram = () => {
    if (!tgToken || !tgChatId) return;
    localStorage.setItem('omni_telegram', JSON.stringify({ botToken: tgToken, chatId: tgChatId }));
    setTgSaved(true); setTgResult(null);
  };

  const testTelegram = async () => {
    setTgTesting(true); setTgResult(null);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'telegram', content: 'Test from OmniFlow AI', title: 'Connection Test', botToken: tgToken, chatId: tgChatId }),
      });
      const data = await res.json();
      setTgResult(data.success ? 'OK! Check Telegram.' : `Failed: ${data.error}`);
    } catch { setTgResult('Network error.'); }
    finally { setTgTesting(false); }
  };

  const saveFacebook = async () => {
    if (!fbToken || !fbPageId) return;
    localStorage.setItem('omni_facebook', JSON.stringify({ pageAccessToken: fbToken, pageId: fbPageId }));
    // Also save to DB for auto-publish
    try {
      await fetch('/api/settings/social-credentials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'facebook', access_token: fbToken, page_id: fbPageId }),
      });
    } catch { /* ignore */ }
    setFbSaved(true); setFbResult(null);
  };

  const testFacebook = async () => {
    setFbTesting(true); setFbResult(null);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'facebook', content: 'Test post from OmniFlow AI — connection works!', title: 'OmniFlow AI Test', pageAccessToken: fbToken, pageId: fbPageId }),
      });
      const data = await res.json();
      setFbResult(data.success ? `OK! Post ID: ${data.platformPostId}` : `Failed: ${data.error}`);
    } catch { setFbResult('Network error.'); }
    finally { setFbTesting(false); }
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage API keys and platform connections.</p>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="size-5" /> API Keys</CardTitle>
          <CardDescription>Configured via environment variables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Gemini API Key</Label>
            <Input type="password" value="••••••••••••••••" readOnly />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="size-3 text-green-600" /> Set via GEMINI_API_KEY in .env.local
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>OpenRouter API Key</Label>
            <Input type="password" placeholder="sk-or-..." />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="size-3 text-yellow-600" /> Optional
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="size-5 text-muted-foreground" /> AI Provider</CardTitle>
          <CardDescription>Choose which AI model to use for content generation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Button
              variant={aiProvider === 'gemini' ? 'default' : 'outline'}
              className="flex-1 h-20 flex-col gap-1.5"
              onClick={() => saveAiProvider('gemini')}
              disabled={aiSaving}
            >
              <span className="text-sm font-semibold">Gemini</span>
              <span className="text-[10px] opacity-70">gemini-3.1-flash-lite</span>
            </Button>
            <Button
              variant={aiProvider === 'groq' ? 'default' : 'outline'}
              className="flex-1 h-20 flex-col gap-1.5"
              onClick={() => saveAiProvider('groq')}
              disabled={aiSaving}
            >
              <span className="text-sm font-semibold">Llama</span>
              <span className="text-[10px] opacity-70">llama-3.1-8b-instant (Groq)</span>
            </Button>
          </div>
          {aiProvider === 'groq' && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="size-3" /> Groq free tier: ~500-800 tok/s, cực nhanh.
            </p>
          )}
          {aiProvider === 'gemini' && (
            <p className="text-xs text-muted-foreground">Gemini free tier: 1500 req/ngày với flash.</p>
          )}
        </CardContent>
      </Card>

      {/* Facebook Page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="size-5 text-blue-600" /> Facebook Page</CardTitle>
          <CardDescription>Publish directly to your Facebook Page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Page Access Token</Label>
            <Input type="password" placeholder="EAA..." value={fbToken}
              onChange={(e) => { setFbToken(e.target.value); setFbSaved(false); setFbResult(null); }} />
          </div>
          <div className="space-y-2">
            <Label>Page ID</Label>
            <Input placeholder="123456789" value={fbPageId}
              onChange={(e) => { setFbPageId(e.target.value); setFbSaved(false); setFbResult(null); }} />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveFacebook} disabled={!fbToken || !fbPageId} className="gap-1.5">
              <Check className="size-4" /> Save
            </Button>
            <Button variant="outline" onClick={testFacebook} disabled={!fbSaved || fbTesting}>
              <Globe className="size-4 mr-1.5" /> {fbTesting ? 'Testing...' : 'Test Post'}
            </Button>
          </div>
          {fbResult && (
            <p className={`text-sm p-3 rounded-lg ${fbResult.startsWith('OK') ? 'bg-green-50 text-green-700 dark:bg-green-950/20' : 'bg-red-50 text-red-700 dark:bg-red-950/20'}`}>{fbResult}</p>
          )}
          {fbSaved && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="size-3" /> Facebook credentials saved (localStorage).</p>}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">How to get your Page Access Token:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Graph API Explorer</a></li>
              <li>Select your Meta App (or create one at developers.facebook.com)</li>
              <li>Click <strong>Get User Token</strong> → check <code className="bg-muted px-1 rounded text-xs">pages_manage_posts</code></li>
              <li>After getting User Token, click the <strong>Get Page Access Token</strong> button (blue (i) icon)</li>
              <li>Select your Page → copy the <strong>Page Access Token</strong></li>
              <li>To get <strong>Page ID</strong>: in the same tool, send GET <code className="bg-muted px-1 rounded text-xs">/me/accounts</code> → find your page</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Bot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="size-5 text-blue-600" /> Telegram Bot (Quick Test)</CardTitle>
          <CardDescription>Fast alternative for testing publish flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bot Token</Label>
            <Input type="password" placeholder="123456:ABC-DEF..." value={tgToken}
              onChange={(e) => { setTgToken(e.target.value); setTgSaved(false); setTgResult(null); }} />
          </div>
          <div className="space-y-2">
            <Label>Chat ID</Label>
            <Input placeholder="-1001234567890" value={tgChatId}
              onChange={(e) => { setTgChatId(e.target.value); setTgSaved(false); setTgResult(null); }} />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveTelegram} disabled={!tgToken || !tgChatId} className="gap-1.5">
              <Check className="size-4" /> Save
            </Button>
            <Button variant="outline" onClick={testTelegram} disabled={!tgSaved || tgTesting}>
              <Send className="size-4 mr-1.5" /> {tgTesting ? 'Testing...' : 'Test Message'}
            </Button>
          </div>
          {tgResult && (
            <p className={`text-sm p-3 rounded-lg ${tgResult.startsWith('OK') ? 'bg-green-50 text-green-700 dark:bg-green-950/20' : 'bg-red-50 text-red-700 dark:bg-red-950/20'}`}>{tgResult}</p>
          )}
          {tgSaved && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="size-3" /> Saved (localStorage).</p>}
        </CardContent>
      </Card>

      {/* RSS News Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Rss className="size-5 text-orange-600" /> RSS News Sources</CardTitle>
          <CardDescription>Add RSS/Atom feeds to crawl. Articles are stored and can be used as source material for AI generation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add form */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label>Source Name</Label>
              <Input placeholder="e.g. TechCrunch" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="flex-[2] space-y-1">
              <Label>Feed URL</Label>
              <Input placeholder="https://example.com/rss" value={newFeedUrl} onChange={(e) => setNewFeedUrl(e.target.value)} />
            </div>
            <div className="w-20 space-y-1">
              <Label>Max Posts</Label>
              <Input type="number" min={1} max={50} value={newMaxPosts} onChange={(e) => setNewMaxPosts(Number(e.target.value) || 10)} />
            </div>
            <Button onClick={addRssSource} disabled={!newName || !newFeedUrl || rssLoading} className="gap-1.5">
              <Plus className="size-4" /> Add
            </Button>
          </div>

          {rssMsg && (
            <div className={`text-sm p-3 rounded-lg ${rssMsg.startsWith('Source') ? 'bg-green-50 text-green-700 dark:bg-green-950/20' : 'bg-red-50 text-red-700 dark:bg-red-950/20'}`}>{rssMsg}</div>
          )}

          <Separator />

          {/* Source list */}
          {rssSources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No RSS sources configured. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {rssSources.map((src) => (
                <div key={src.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{src.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{src.feed_url}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Max: {src.max_posts} posts</span>
                      {src.last_crawled_at && (
                        <span>Last crawl: {new Date(src.last_crawled_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={src.enabled ? 'default' : 'outline'}
                      size="xs"
                      className="h-7 text-xs"
                      onClick={() => toggleRssSource(src.id, !src.enabled)}
                    >
                      {src.enabled ? 'On' : 'Off'}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-600" onClick={() => deleteRssSource(src.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* News Automation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Timer className="size-5 text-muted-foreground" /> News Automation</CardTitle>
          <CardDescription>Configure automated crawl schedule and auto-publish new articles to social media.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Crawl Schedule Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">Crawl Schedule</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Auto-crawl RSS feeds on a schedule. Requires a cron job calling /api/crawl/check.</p>
              </div>
              <Button
                variant={schedule.enabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}
              >
                {schedule.enabled ? 'On' : 'Off'}
              </Button>
            </div>

            {schedule.enabled && (
              <div className="space-y-3 pl-1">
                {/* Mode selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Schedule Mode</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['interval', 'daily', 'weekly', 'monthly'] as const).map((mode) => (
                      <Button
                        key={mode}
                        variant={schedule.schedule_mode === mode ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSchedule({ ...schedule, schedule_mode: mode })}
                      >
                        {mode === 'interval' ? 'Interval' : mode === 'daily' ? 'Daily' : mode === 'weekly' ? 'Weekly' : 'Monthly'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Mode-specific inputs */}
                {schedule.schedule_mode === 'interval' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Cào mỗi</span>
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      className="w-20 h-8 text-center"
                      value={schedule.interval_minutes}
                      onChange={(e) => setSchedule({ ...schedule, interval_minutes: Number(e.target.value) || 10 })}
                    />
                    <span className="text-sm text-muted-foreground">phút</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (next: {schedule.last_triggered_at ? new Date(new Date(schedule.last_triggered_at).getTime() + schedule.interval_minutes * 60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'after first cron run'})
                    </span>
                  </div>
                )}

                {schedule.schedule_mode === 'daily' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Vào lúc</span>
                    <Input
                      type="time"
                      className="w-32 h-8"
                      value={schedule.daily_time?.slice(0, 5) ?? '08:00'}
                      onChange={(e) => setSchedule({ ...schedule, daily_time: e.target.value + ':00' })}
                    />
                    <span className="text-sm text-muted-foreground">mỗi ngày</span>
                  </div>
                )}

                {schedule.schedule_mode === 'weekly' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Vào</span>
                    <select
                      className="h-8 rounded-md border bg-background px-2 text-sm"
                      value={schedule.weekly_day}
                      onChange={(e) => setSchedule({ ...schedule, weekly_day: Number(e.target.value) })}
                    >
                      <option value={1}>Thứ Hai</option>
                      <option value={2}>Thứ Ba</option>
                      <option value={3}>Thứ Tư</option>
                      <option value={4}>Thứ Năm</option>
                      <option value={5}>Thứ Sáu</option>
                      <option value={6}>Thứ Bảy</option>
                      <option value={7}>Chủ Nhật</option>
                    </select>
                    <span className="text-sm text-muted-foreground">lúc</span>
                    <Input
                      type="time"
                      className="w-32 h-8"
                      value={schedule.weekly_time?.slice(0, 5) ?? '08:00'}
                      onChange={(e) => setSchedule({ ...schedule, weekly_time: e.target.value + ':00' })}
                    />
                  </div>
                )}

                {schedule.schedule_mode === 'monthly' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Ngày</span>
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      className="w-16 h-8 text-center"
                      value={schedule.monthly_day}
                      onChange={(e) => setSchedule({ ...schedule, monthly_day: Number(e.target.value) || 1 })}
                    />
                    <span className="text-sm text-muted-foreground">hàng tháng, lúc</span>
                    <Input
                      type="time"
                      className="w-32 h-8"
                      value={schedule.monthly_time?.slice(0, 5) ?? '08:00'}
                      onChange={(e) => setSchedule({ ...schedule, monthly_time: e.target.value + ':00' })}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" onClick={saveSchedule} disabled={scheduleLoading} className="gap-1.5">
                    <RefreshCw className="size-3.5" /> Save Schedule
                  </Button>
                  {scheduleMsg && (
                    <span className={`text-xs ${scheduleMsg.startsWith('Schedule') ? 'text-green-600' : 'text-red-600'}`}>
                      {scheduleMsg}
                    </span>
                  )}
                  {schedule.last_triggered_at && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Last crawl: {new Date(schedule.last_triggered_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Auto Publish Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm flex items-center gap-1.5"><Rocket className="size-4 text-muted-foreground" /> Auto Publish</h3>
              <p className="text-xs text-muted-foreground mt-0.5">When new articles are crawled, automatically generate a social post and publish to the configured platform.</p>
            </div>

            {rssSources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Add RSS sources above to configure auto-publish.</p>
            ) : (
              <div className="space-y-3">
                {rssSources.map((src) => (
                  <div key={src.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{src.name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] text-muted-foreground">Auto</Label>
                          <Button
                            variant={src.auto_publish ? 'default' : 'outline'}
                            size="xs"
                            className="h-6 text-[10px] px-2"
                            onClick={() => updateAutoPublish(src.id, 'auto_publish', !src.auto_publish)}
                          >
                            {src.auto_publish ? 'On' : 'Off'}
                          </Button>
                        </div>
                        {src.auto_publish && (
                          <>
                            <div className="flex items-center gap-1">
                              <Label className="text-[10px] text-muted-foreground">Tone</Label>
                              <select
                                className="h-6 rounded border bg-background text-[10px] px-1.5"
                                value={src.auto_publish_tone}
                                onChange={(e) => updateAutoPublish(src.id, 'auto_publish_tone', e.target.value)}
                              >
                                <option value="professional">Professional</option>
                                <option value="casual">Casual</option>
                                <option value="persuasive">Persuasive</option>
                                <option value="informative">Informative</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="size-3" />
              Requires Facebook credentials above and the cron endpoint to be active.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="size-5 text-muted-foreground" /> Email Notifications</CardTitle>
          <CardDescription>Get notified when articles are auto-published. Uses Gmail SMTP with App Password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Notify on publish</Label>
            <Button
              variant={emailCfg.notify_on_publish ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEmailCfg({ ...emailCfg, notify_on_publish: !emailCfg.notify_on_publish })}
            >
              {emailCfg.notify_on_publish ? 'On' : 'Off'}
            </Button>
          </div>

          {emailCfg.notify_on_publish && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">SMTP Host</Label>
                  <Input value={emailCfg.smtp_host} onChange={(e) => setEmailCfg({ ...emailCfg, smtp_host: e.target.value })} placeholder="smtp.gmail.com" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">SMTP Port</Label>
                  <Input type="number" value={emailCfg.smtp_port} onChange={(e) => setEmailCfg({ ...emailCfg, smtp_port: Number(e.target.value) || 587 })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Gmail Address</Label>
                  <Input value={emailCfg.smtp_user} onChange={(e) => setEmailCfg({ ...emailCfg, smtp_user: e.target.value })} placeholder="you@gmail.com" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">App Password</Label>
                  <Input type="password" value={emailCfg.smtp_pass} onChange={(e) => setEmailCfg({ ...emailCfg, smtp_pass: e.target.value })} placeholder="xxxx xxxx xxxx xxxx" className="h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Recipient Email</Label>
                <Input value={emailCfg.recipient_email} onChange={(e) => setEmailCfg({ ...emailCfg, recipient_email: e.target.value })} placeholder="where to send notifications" className="h-8 text-sm" />
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveEmailSettings} disabled={emailSaving} className="gap-1.5">
                  <Check className="size-3.5" /> Save Email Settings
                </Button>
                {emailMsg && (
                  <span className={`text-xs ${emailMsg.startsWith('Email') ? 'text-green-600' : 'text-red-600'}`}>{emailMsg}</span>
                )}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="size-3" />
                Tạo App Password tại Google Account → Security → 2-Step Verification → App Passwords.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Other Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Other Platforms</CardTitle>
          <CardDescription>Coming soon. Click for setup docs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { name: 'Instagram Business', icon: <Camera className="size-4" />, url: 'https://developers.facebook.com/docs/instagram-api' },
            { name: 'X (Twitter)', icon: <Hash className="size-4" />, url: 'https://developer.x.com/en/docs/authentication/oauth-2-0' },
            { name: 'YouTube', icon: <Video className="size-4" />, url: 'https://developers.google.com/youtube/v3' },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-full bg-muted text-muted-foreground">{p.icon}</div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-blue-600">{p.name}</a>
              </div>
              <Badge variant="outline" className="text-muted-foreground">coming soon</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

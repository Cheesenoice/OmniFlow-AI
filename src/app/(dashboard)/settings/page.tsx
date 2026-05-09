'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Key, Check, AlertCircle, Send, Globe, Camera, Hash, Video } from 'lucide-react';

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

  const saveFacebook = () => {
    if (!fbToken || !fbPageId) return;
    localStorage.setItem('omni_facebook', JSON.stringify({ pageAccessToken: fbToken, pageId: fbPageId }));
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

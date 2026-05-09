'use client';

import { useState, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { InputPanel } from '@/components/dashboard/input-panel';
import { OutputPanel } from '@/components/dashboard/output-panel';
import { ContentPreviewDialog } from '@/components/dashboard/content-preview-dialog';
import { Sparkles } from 'lucide-react';
import type { PlatformType, ContentType, GeneratedContent } from '@/types';

interface PreviewState {
  open: boolean;
  title: string;
  body: string;
  contentType: ContentType;
  platform: string;
  wordCount: number;
  date: string;
  status: 'draft' | 'published';
}

export default function DashboardPage() {
  const [results, setResults] = useState<GeneratedContent[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [ragUsed, setRagUsed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [preview, setPreview] = useState<PreviewState>({
    open: false,
    title: '',
    body: '',
    contentType: 'blog',
    platform: '',
    wordCount: 0,
    date: '',
    status: 'draft',
  });

  const handleGenerate = useCallback(
    async (idea: string, platforms: PlatformType[], tone: string, audience: string, docxFile?: File | null) => {
      setIsGenerating(true);
      setResults(null);
      setGenError(null);
      setRagUsed(false);

      const formData = new FormData();
      formData.append('idea', idea);
      formData.append('platforms', JSON.stringify(platforms));
      formData.append('tone', tone);
      formData.append('audience', audience);
      if (docxFile) {
        formData.append('docx', docxFile);
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Generation failed');
        }

        if (data.errors?.length > 0) {
          console.warn('Generation warnings:', data.errors);
        }

        setResults(data.items);
        setRagUsed(data.ragContextUsed ?? false);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setGenError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [],
  );

  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  const handlePublish = useCallback(async (item: GeneratedContent) => {
    setPublishMsg(null);

    // Pick platform: Facebook for social_fb, Telegram fallback for everything else
    const isFb = item.content_type === 'social_fb';

    if (isFb) {
      const saved = localStorage.getItem('omni_facebook');
      if (!saved) { setPublishMsg('Configure Facebook Page in Settings first.'); return; }
      try {
        const c = JSON.parse(saved);
        setPublishMsg('Publishing to Facebook...');
        const res = await fetch('/api/publish', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'facebook', content: item.body, title: item.title, pageAccessToken: c.pageAccessToken, pageId: c.pageId }),
        });
        const data = await res.json();
        setPublishMsg(data.success ? `Published to Facebook! Post ID: ${data.platformPostId}` : `Failed: ${data.error}`);
      } catch { setPublishMsg('Network error.'); }
      return;
    }

    // Default: Telegram
    const saved = localStorage.getItem('omni_telegram');
    if (!saved) { setPublishMsg('Configure Telegram or Facebook in Settings first.'); return; }
    try {
      const c = JSON.parse(saved);
      setPublishMsg('Publishing to Telegram...');
      const res = await fetch('/api/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'telegram', content: item.body, title: item.title, botToken: c.botToken, chatId: c.chatId }),
      });
      const data = await res.json();
      setPublishMsg(data.success ? `Published to Telegram! Message ID: ${data.platformPostId}` : `Failed: ${data.error}`);
    } catch { setPublishMsg('Network error.'); }
  }, []);

  const handleView = useCallback((item: GeneratedContent) => {
    const platformLabels: Record<ContentType, string> = {
      blog: 'WordPress Blog',
      social_fb: 'Facebook',
      social_ig: 'Instagram',
      social_x: 'X (Twitter)',
      social_threads: 'Threads',
      youtube_script: 'YouTube',
      docx_report: 'Report',
    };
    setPreview({
      open: true,
      title: item.title,
      body: item.body,
      contentType: item.content_type,
      platform: platformLabels[item.content_type],
      wordCount: item.body.split(/\s+/).length,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
    });
  }, []);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Content</h1>
          <p className="text-muted-foreground mt-1">
            Input your idea and let AI generate multi-platform content.
          </p>
          {ragUsed && (
            <p className="text-xs text-blue-600 mt-1">
              Digital Brain context applied — brand voice from past content
            </p>
          )}
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="size-3" />
          Gemini 2.5 Flash
        </Badge>
      </div>

      {/* Error banner */}
      {genError && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          Generation failed: {genError}
        </div>
      )}

      {/* Input Panel */}
      <InputPanel onGenerate={handleGenerate} isGenerating={isGenerating} />

      {/* Publish feedback */}
      {publishMsg && (
        <div className={`rounded-lg border p-4 text-sm ${
          publishMsg.startsWith('Published') ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:border-green-800' :
          publishMsg.startsWith('Publishing') ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:border-blue-800' :
          'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-800'
        }`}>{publishMsg}</div>
      )}

      {/* Output Panel */}
      <OutputPanel
        results={results}
        isGenerating={isGenerating}
        onView={handleView}
        onPublish={handlePublish}
      />

      {/* Preview Dialog */}
      <ContentPreviewDialog
        open={preview.open}
        onOpenChange={(open) => setPreview((p) => ({ ...p, open }))}
        title={preview.title}
        body={preview.body}
        contentType={preview.contentType}
        platform={preview.platform}
        wordCount={preview.wordCount}
        date={preview.date}
        status={preview.status}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  MessageCircle,
  Video,
  Globe,
  Camera,
  Hash,
  Copy,
  Eye,
  RefreshCw,
  Send,
  Calendar,
  Wand2,
  Loader2,
  X,
} from 'lucide-react';
import type { ContentType } from '@/types';

interface ContentCardProps {
  title: string;
  body: string;
  contentType: ContentType;
  platform: string;
  wordCount: number;
  date: string;
  status: 'draft' | 'published';
  onView?: () => void;
  onRemix?: () => void;
  onPublish?: () => void;
  onRefined?: (newBody: string) => void;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  blog: { icon: <FileText className="size-3.5" />, label: 'Blog', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  social_fb: { icon: <Globe className="size-3.5" />, label: 'Facebook', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  social_ig: { icon: <Camera className="size-3.5" />, label: 'Instagram', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  social_x: { icon: <Hash className="size-3.5" />, label: 'X/Twitter', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  social_threads: { icon: <MessageCircle className="size-3.5" />, label: 'Threads', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  youtube_script: { icon: <Video className="size-3.5" />, label: 'YouTube', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  docx_report: { icon: <FileText className="size-3.5" />, label: 'Report', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

export function ContentCard({
  title,
  body,
  contentType,
  platform,
  wordCount,
  date,
  status,
  onView,
  onRemix,
  onPublish,
  onRefined,
}: ContentCardProps) {
  const [currentBody, setCurrentBody] = useState(body);
  useEffect(() => { setCurrentBody(body); }, [body]);
  const [showRefine, setShowRefine] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const config = typeConfig[contentType] ?? {
    icon: <FileText className="size-3.5" />,
    label: platform,
    color: 'bg-muted text-muted-foreground',
  };

  const preview =
    currentBody.length > 180 ? currentBody.slice(0, 180).replace(/\n/g, ' ') + '...' : currentBody.replace(/\n/g, ' ');

  const handleRefine = async () => {
    if (!refinePrompt.trim()) return;
    setRefineLoading(true);
    setRefineError(null);
    try {
      const res = await fetch('/api/generate/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: currentBody,
          instruction: refinePrompt,
          platform,
        }),
      });
      const data = await res.json();
      if (res.ok && data.refined) {
        setCurrentBody(data.refined);
        onRefined?.(data.refined);
        setShowRefine(false);
        setRefinePrompt('');
      } else {
        setRefineError(data.error || 'Refine failed');
      }
    } catch {
      setRefineError('Network error');
    } finally {
      setRefineLoading(false);
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-blue-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="secondary" className={config.color}>
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
            {status === 'published' && (
              <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                Published
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Calendar className="size-3" />
            {date}
          </span>
        </div>
        <CardTitle className="text-base mt-2">{title}</CardTitle>
        <CardDescription className="text-xs">{wordCount} words</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
          {preview}
        </p>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onView}>
            <Eye className="size-3.5" />
            View
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigator.clipboard.writeText(currentBody)}>
            <Copy className="size-3.5" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-purple-600" onClick={() => setShowRefine(prev => !prev)}>
            <Wand2 className="size-3.5" />
            Refine
          </Button>
          {status === 'draft' && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-green-600" onClick={onPublish}>
              <Send className="size-3.5" />
              Publish
            </Button>
          )}
        </div>

        {/* Inline Refine Panel */}
        {showRefine && (
          <div className="mt-3 space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">AI Refine</span>
              <Button variant="ghost" size="icon" className="size-6" onClick={() => { setShowRefine(false); setRefineError(null); }}>
                <X className="size-3" />
              </Button>
            </div>
            <Textarea
              placeholder="e.g. make it shorter, add emojis, translate to Vietnamese..."
              className="h-16 text-xs resize-none"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleRefine()}
            />
            {refineError && (
              <p className="text-xs text-red-500">{refineError}</p>
            )}
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleRefine}
              disabled={refineLoading || !refinePrompt.trim()}
            >
              {refineLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Wand2 className="size-3" />
              )}
              {refineLoading ? 'Refining...' : 'Refine'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

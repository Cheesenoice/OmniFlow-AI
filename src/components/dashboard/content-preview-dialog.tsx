'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Send, RefreshCw, Calendar } from 'lucide-react';
import type { ContentType } from '@/types';

interface ContentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  contentType: ContentType;
  platform: string;
  wordCount: number;
  date: string;
  status: 'draft' | 'published';
}

const typeLabel: Record<ContentType, string> = {
  blog: 'Blog Post',
  social_fb: 'Facebook',
  social_ig: 'Instagram',
  social_x: 'X (Twitter)',
  social_threads: 'Threads',
  youtube_script: 'YouTube Script',
  docx_report: 'Report',
};

export function ContentPreviewDialog({
  open,
  onOpenChange,
  title,
  body,
  contentType,
  platform,
  wordCount,
  date,
  status,
}: ContentPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary">{typeLabel[contentType]}</Badge>
            {status === 'published' && (
              <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30">
                Published
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {date}
            </span>
            <span>{wordCount} words</span>
            <span>{platform}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {body.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-xl font-semibold mt-5 mb-2">{line.slice(3)}</h2>;
              }
              if (line.match(/^\d\.\s/)) {
                return <li key={i} className="ml-4 text-sm">{line}</li>;
              }
              if (line.startsWith('- ') || line.startsWith('• ')) {
                return <li key={i} className="ml-4 text-sm">{line.replace(/^[•-]\s/, '')}</li>;
              }
              if (line.trim() === '') {
                return <br key={i} />;
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="text-sm font-bold mt-4">{line.replace(/\*\*/g, '')}</p>;
              }
              return <p key={i} className="text-sm leading-relaxed">{line}</p>;
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 pt-4 border-t mt-4">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigator.clipboard.writeText(body)}>
            <Copy className="size-3.5" />
            Copy All
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Remix
          </Button>
          <div className="flex-1" />
          <Button size="sm" className="gap-1.5">
            <Send className="size-3.5" />
            Publish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

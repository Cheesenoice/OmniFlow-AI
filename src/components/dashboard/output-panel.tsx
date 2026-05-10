'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContentCard } from './content-card';
import { Sparkles } from 'lucide-react';
import type { ContentType, GeneratedContent } from '@/types';

interface OutputPanelProps {
  results: GeneratedContent[] | null;
  isGenerating: boolean;
  onView?: (item: GeneratedContent) => void;
  onPublish?: (item: GeneratedContent) => void;
  onRefine?: (item: GeneratedContent) => void;
}

export function OutputPanel({ results, isGenerating, onView, onPublish, onRefine }: OutputPanelProps) {
  if (isGenerating) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative">
            <div className="size-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <Sparkles className="size-5 text-blue-600 absolute inset-0 m-auto" />
          </div>
          <h3 className="text-lg font-medium mt-6">Generating content...</h3>
          <p className="text-sm text-muted-foreground mt-1">
            AI is crafting your blog, social posts, and video scripts.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="size-10 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Ready to create</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
            Enter an idea above and click Generate. Output will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const blogPosts = results.filter((r) => r.content_type === 'blog');
  const socialPosts = results.filter(
    (r) => r.content_type.startsWith('social_'),
  );
  const youtubeScripts = results.filter((r) => r.content_type === 'youtube_script');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Generated Content</h2>
        <Badge variant="secondary">
          {results.length} piece{results.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All ({results.length})
          </TabsTrigger>
          {blogPosts.length > 0 && (
            <TabsTrigger value="blog">Blog ({blogPosts.length})</TabsTrigger>
          )}
          {socialPosts.length > 0 && (
            <TabsTrigger value="social">Social ({socialPosts.length})</TabsTrigger>
          )}
          {youtubeScripts.length > 0 && (
            <TabsTrigger value="youtube">YouTube ({youtubeScripts.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((item, i) => (
              <ContentCard
                key={i}
                title={item.title}
                body={item.body}
                contentType={item.content_type}
                platform={getPlatformLabel(item.content_type)}
                wordCount={item.body.split(/\s+/).length}
                date={new Date().toISOString().split('T')[0]}
                status="draft"
                onView={() => onView?.(item)}
                onPublish={() => onPublish?.(item)}
                onRefined={(newBody) => onRefine?.({ ...item, body: newBody })}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="blog" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {blogPosts.map((item, i) => (
              <ContentCard
                key={i}
                title={item.title}
                body={item.body}
                contentType={item.content_type}
                platform="Blog"
                wordCount={item.body.split(/\s+/).length}
                date={new Date().toISOString().split('T')[0]}
                status="draft"
                onView={() => onView?.(item)}
                onPublish={() => onPublish?.(item)}
                onRefined={(newBody: string) => onRefine?.({ ...item, body: newBody })}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="social" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {socialPosts.map((item, i) => (
              <ContentCard
                key={i}
                title={item.title}
                body={item.body}
                contentType={item.content_type}
                platform={getPlatformLabel(item.content_type)}
                wordCount={item.body.split(/\s+/).length}
                date={new Date().toISOString().split('T')[0]}
                status="draft"
                onView={() => onView?.(item)}
                onPublish={() => onPublish?.(item)}
                onRefined={(newBody: string) => onRefine?.({ ...item, body: newBody })}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="youtube" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {youtubeScripts.map((item, i) => (
              <ContentCard
                key={i}
                title={item.title}
                body={item.body}
                contentType={item.content_type}
                platform="YouTube"
                wordCount={item.body.split(/\s+/).length}
                date={new Date().toISOString().split('T')[0]}
                status="draft"
                onView={() => onView?.(item)}
                onPublish={() => onPublish?.(item)}
                onRefined={(newBody: string) => onRefine?.({ ...item, body: newBody })}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getPlatformLabel(contentType: ContentType): string {
  const map: Record<ContentType, string> = {
    blog: 'Blog',
    social_fb: 'Facebook',
    social_ig: 'Instagram',
    social_x: 'X (Twitter)',
    social_threads: 'Threads',
    youtube_script: 'YouTube',
    docx_report: 'Report',
  };
  return map[contentType] ?? contentType;
}

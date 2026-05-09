'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, FileText, MessageCircle, Video, Search, RefreshCw } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  platform: string;
  date: string;
  status: 'draft' | 'published' | 'failed' | 'archived';
}

const placeholderContent: ContentItem[] = [
  { id: '1', title: 'How AI Agents Transform Customer Support', type: 'blog', platform: 'Blog', date: '2026-05-08', status: 'draft' },
  { id: '2', title: 'Instagram Caption: AI Tools for Marketers', type: 'social_ig', platform: 'Instagram', date: '2026-05-07', status: 'published' },
  { id: '3', title: 'YouTube Shorts: 5 AI Hacks in 60 Seconds', type: 'youtube_script', platform: 'YouTube', date: '2026-05-06', status: 'draft' },
  { id: '4', title: 'Twitter Thread: Why Content AI is the Future', type: 'social_x', platform: 'X (Twitter)', date: '2026-05-05', status: 'published' },
  { id: '5', title: 'Facebook Post: Community Building with AI', type: 'social_fb', platform: 'Facebook', date: '2026-05-04', status: 'archived' },
];

const typeIcon: Record<string, React.ReactNode> = {
  blog: <FileText className="size-4" />,
  social_ig: <MessageCircle className="size-4" />,
  social_fb: <MessageCircle className="size-4" />,
  social_x: <MessageCircle className="size-4" />,
  youtube_script: <Video className="size-4" />,
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  published: 'default',
  failed: 'destructive',
  archived: 'outline',
};

export default function ArchivePage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const filtered = placeholderContent.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.status === filter || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Archive</h1>
          <p className="text-muted-foreground mt-1">
            Browse, search, and remix your previously generated content.
          </p>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'blog', label: 'Blog' },
            { value: 'draft', label: 'Drafts' },
            { value: 'published', label: 'Published' },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Archive className="size-10 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No content found</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {search ? 'Try a different search term.' : 'Start by generating content on the Dashboard.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="group hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    {typeIcon[item.type]}
                    <span>{item.platform}</span>
                  </div>
                  <Badge variant={statusVariant[item.status]}>
                    {item.status}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription>{item.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <RefreshCw className="size-3.5" />
                  Remix this content
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

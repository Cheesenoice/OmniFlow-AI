'use client';

import { useState, useRef, useEffect, type DragEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap,
  Upload,
  Sparkles,
  FileText,
  X,
  Loader2,
  Newspaper,
} from 'lucide-react';
import type { PlatformType, ContentType } from '@/types';

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'informative', label: 'Informative' },
] as const;

const AUDIENCES = [
  { value: 'general', label: 'General Audience' },
  { value: 'developers', label: 'Developers' },
  { value: 'marketers', label: 'Marketers' },
  { value: 'executives', label: 'Executives' },
  { value: 'students', label: 'Students' },
] as const;

interface PlatformOption {
  platform: PlatformType;
  label: string;
  contentType: ContentType;
  enabled: boolean;
}

const PLATFORMS: PlatformOption[] = [
  { platform: 'wordpress', label: 'Blog Post', contentType: 'blog', enabled: true },
  { platform: 'facebook', label: 'Facebook', contentType: 'social_fb', enabled: true },
  { platform: 'instagram', label: 'Instagram', contentType: 'social_ig', enabled: true },
  { platform: 'x_twitter', label: 'X (Twitter)', contentType: 'social_x', enabled: true },
  { platform: 'threads', label: 'Threads', contentType: 'social_threads', enabled: false },
  { platform: 'youtube', label: 'YouTube Shorts', contentType: 'youtube_script', enabled: false },
];

const MAX_CHARS = 2000;

interface InputPanelProps {
  featured?: boolean;
  onGenerate?: (idea: string, platforms: PlatformType[], tone: string, audience: string, docxFile?: File | null) => void;
  isGenerating?: boolean;
  crawledArticle?: { title: string; body: string; url: string; source: string } | null;
}

export function InputPanel({ onGenerate, isGenerating = false, crawledArticle }: InputPanelProps) {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('general');
  const [platforms, setPlatforms] = useState(
    PLATFORMS.filter((p) => p.enabled).map((p) => p.platform),
  );
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill idea from crawled article
  const [crawledSource, setCrawledSource] = useState<string | null>(null);
  useEffect(() => {
    if (crawledArticle) {
      const text = `[Source: ${crawledArticle.source}] ${crawledArticle.title}\n\n${crawledArticle.body.slice(0, 1500)}`;
      setIdea(text);
      setCrawledSource(crawledArticle.source);
    }
  }, [crawledArticle]);

  const charCount = idea.length;
  const isOverLimit = charCount > MAX_CHARS;

  const togglePlatform = (platform: PlatformType) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const handleFile = (file: File) => {
    if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setDocxFile(file);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setDocxFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = () => {
    if (!idea.trim() || isOverLimit || platforms.length === 0) return;
    onGenerate?.(idea.trim(), platforms, tone, audience, docxFile);
  };

  const canGenerate = idea.trim().length > 0 && !isOverLimit && platforms.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Input */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5 text-blue-600" />
            Input Idea
          </CardTitle>
          <CardDescription>
            Describe your content idea. Add context, keywords, or a rough outline —
            the AI handles the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {crawledSource && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/20 rounded-md px-3 py-2">
                <Newspaper className="size-3.5" />
                <span>Using crawled article from <strong>{crawledSource}</strong> as source. Edit the text below or generate as-is.</span>
              </div>
            )}
            <Textarea
              placeholder="e.g. Write about how AI agents are transforming customer support in 2026. Cover: 1) current state, 2) key benefits, 3) real examples, 4) how to get started..."
              className="min-h-40 resize-y"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {platforms.length > 0 ? `${platforms.length} platform${platforms.length > 1 ? 's' : ''} selected` : 'No platform selected'}
              </span>
              <span className={isOverLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                {charCount}/{MAX_CHARS}
              </span>
            </div>
          </div>

          {/* Upload area */}
          <div
            className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                : docxFile
                  ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {docxFile ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="size-5 text-green-600" />
                  <span className="font-medium">{docxFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(docxFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} className="shrink-0">
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag &amp; drop a <code className="text-xs bg-muted px-1 rounded">.docx</code> file
                  here, or{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline font-medium"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </button>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </>
            )}
          </div>

          <Button
            className="gap-2 w-full"
            size="lg"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sidebar Options */}
      <div className="space-y-4">
        {/* Tone */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tone</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={tone} onValueChange={(val) => setTone(val ?? 'professional')}>
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Audience */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Target Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={audience} onValueChange={(val) => setAudience(val ?? 'general')}>
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Platform Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Platforms</CardTitle>
            <CardDescription>Select where to publish</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PLATFORMS.map((p) => (
                <div key={p.platform} className="flex items-center gap-3">
                  <Checkbox
                    id={`platform-${p.platform}`}
                    checked={platforms.includes(p.platform)}
                    onCheckedChange={() => togglePlatform(p.platform)}
                  />
                  <Label
                    htmlFor={`platform-${p.platform}`}
                    className="text-sm cursor-pointer leading-none"
                  >
                    {p.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">Tone:</span> {TONES.find((t) => t.value === tone)?.label}
              </p>
              <p>
                <span className="font-medium">Audience:</span>{' '}
                {AUDIENCES.find((a) => a.value === audience)?.label}
              </p>
              <p>
                <span className="font-medium">Outputs:</span>{' '}
                {platforms.length} platform{platforms.length !== 1 ? 's' : ''}
              </p>
              {docxFile && (
                <p>
                  <span className="font-medium">Source:</span> {docxFile.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

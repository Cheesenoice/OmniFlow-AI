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
  Database,
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
  onGenerate?: (idea: string, platforms: PlatformType[], tone: string, audience: string, files?: File[]) => void;
  isGenerating?: boolean;
  crawledArticle?: { title: string; body: string; url: string; source: string } | null;
  storedDocument?: { title: string; body: string; source: string; type: string } | null;
}

const ALLOWED_EXTENSIONS = ['.docx', '.doc', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/pdf',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp',
];

function isAllowedFile(file: File): boolean {
  if (ALLOWED_TYPES.includes(file.type)) return true;
  return ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

export function InputPanel({ onGenerate, isGenerating = false, crawledArticle, storedDocument }: InputPanelProps) {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('general');
  const [platforms, setPlatforms] = useState(
    PLATFORMS.filter((p) => p.enabled).map((p) => p.platform),
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [storing, setStoring] = useState(false);
  const [storeMsg, setStoreMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill idea from crawled article or stored document
  const [crawledSource, setCrawledSource] = useState<string | null>(null);
  useEffect(() => {
    if (crawledArticle) {
      const text = `[Source: ${crawledArticle.source}] ${crawledArticle.title}\n\n${crawledArticle.body.slice(0, 1500)}`;
      setIdea(text);
      setCrawledSource(crawledArticle.source);
    }
  }, [crawledArticle]);

  useEffect(() => {
    if (storedDocument) {
      const text = `[Stored Document: ${storedDocument.source} (${storedDocument.type})]\nTitle: ${storedDocument.title}\n\n${storedDocument.body.slice(0, 1500)}`;
      setIdea(text);
      setCrawledSource(`📁 ${storedDocument.source}`);
    }
  }, [storedDocument]);

  const charCount = idea.length;
  const isOverLimit = charCount > MAX_CHARS;

  const togglePlatform = (platform: PlatformType) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const handleFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter(isAllowedFile);
    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleStore = async () => {
    if (uploadedFiles.length === 0) return;
    setStoring(true);
    setStoreMsg(null);
    try {
      const fd = new FormData();
      for (const f of uploadedFiles) fd.append('files', f);
      const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setStoreMsg(`Đã lưu ${data.stored}/${data.total} files vào Storage.`);
        setUploadedFiles([]);
      } else {
        setStoreMsg(`Lỗi: ${data.error}`);
      }
    } catch {
      setStoreMsg('Không thể kết nối đến server.');
    } finally {
      setStoring(false);
      setTimeout(() => setStoreMsg(null), 4000);
    }
  };

  const handleGenerate = () => {
    if (!idea.trim() || isOverLimit || platforms.length === 0) return;
    onGenerate?.(idea.trim(), platforms, tone, audience, uploadedFiles.length > 0 ? uploadedFiles : undefined);
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
                {storedDocument ? <Database className="size-3.5" /> : <Newspaper className="size-3.5" />}
                <span>Using <strong>{crawledSource}</strong> as source. Edit the text below or generate as-is.</span>
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
            className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                : uploadedFiles.length > 0
                  ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto size-6 text-muted-foreground/40 mb-1.5" />
            <p className="text-sm text-muted-foreground">
              Drag &amp; drop <code className="text-xs bg-muted px-1 rounded">.docx</code>,{' '}
              <code className="text-xs bg-muted px-1 rounded">.pdf</code>, or images here, or{' '}
              <button type="button" className="text-blue-600 hover:underline font-medium"
                onClick={() => fileInputRef.current?.click()}>browse</button>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".docx,.doc,.pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {/* File chips */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-full px-2.5 py-1">
                  <FileText className="size-3 text-green-600" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <span className="text-muted-foreground">({(f.size / 1024).toFixed(0)}KB)</span>
                  <button onClick={() => removeFile(i)} className="ml-0.5 hover:text-red-500"><X className="size-3" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Store message */}
          {storeMsg && (
            <div className={`text-xs p-2.5 rounded-lg ${
              storeMsg.startsWith('Đã') ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' :
              'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
            }`}>{storeMsg}</div>
          )}

          <div className="flex gap-2">
            {uploadedFiles.length > 0 && (
              <Button variant="outline" size="lg" className="gap-1.5" onClick={handleStore} disabled={storing}>
                {storing ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
                {storing ? 'Đang lưu...' : 'Save to Storage'}
              </Button>
            )}
            <Button
              className="gap-2 flex-1"
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
          </div>
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
              {uploadedFiles.length > 0 && (
                <p>
                  <span className="font-medium">Files:</span> {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

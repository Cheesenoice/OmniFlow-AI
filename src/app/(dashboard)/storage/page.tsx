'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Search, FileText, Image, FileType, Trash2, Sparkles,
  Database, ChevronLeft, ChevronRight, FolderOpen, ExternalLink,
} from 'lucide-react';

interface StoredDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  original_text: string;
  ai_summary: string;
  ai_json: Record<string, unknown>;
  created_at: string;
}

interface DocGroup {
  session_id: string;
  created_at: string;
  file_count: number;
  files: StoredDocument[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function StoragePage() {
  const [groups, setGroups] = useState<DocGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<DocGroup | null>(null);
  const limit = 20;

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (fileType) params.set('type', fileType);
      const res = await fetch(`/api/storage/documents?${params}`);
      const data = await res.json();
      if (res.ok) { setGroups(data.groups ?? []); setTotal(data.total ?? 0); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, fileType]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const deleteDoc = async (id: string) => {
    await fetch(`/api/storage/documents?id=${id}`, { method: 'DELETE' });
    fetchDocs();
  };

  const useForGeneration = (group: DocGroup) => {
    // Combine all files: doc text + image URLs
    const textParts: string[] = [];
    const imageUrls: string[] = [];

    for (const f of group.files) {
      if (f.file_type === 'image') {
        imageUrls.push(f.original_text); // the URL stored in DB
      } else {
        const title = (f.ai_json as any)?.title || f.file_name;
        textParts.push(`[${title}]\n${f.ai_summary}\n${f.original_text.slice(0, 2000)}`);
      }
    }

    const body = textParts.join('\n\n---\n\n');
    const names = group.files.map(f => f.file_name).join(', ');

    sessionStorage.setItem('omni_stored_document', JSON.stringify({
      title: names,
      body,
      source: names,
      type: 'storage',
      image_urls: imageUrls,
    }));
    window.location.href = '/dashboard';
  };

  const typeIcon = (t: string) => {
    if (t === 'image') return <Image className="size-4" />;
    if (t === 'pdf') return <FileType className="size-4" />;
    return <FileText className="size-4" />;
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Storage</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tài liệu đã được AI xử lý — dùng làm nguồn tạo nội dung.</p>
        </div>
        <Badge variant="secondary" className="rounded-full">{total} nhóm tài liệu</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: '', label: 'All' },
              { key: 'docx', label: 'DOCX' },
              { key: 'pdf', label: 'PDF' },
              { key: 'image', label: 'Images' },
            ].map((f) => (
              <Button key={f.key} variant={fileType === f.key ? 'default' : 'ghost'} size="sm" className="rounded-full h-8"
                onClick={() => { setFileType(f.key); setPage(1); }}>
                {f.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm..." className="pl-9 rounded-full h-9" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </CardContent>
      </Card>

      {/* Grouped Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="size-10 text-muted-foreground/30 mb-3" />
            <h3 className="font-medium text-muted-foreground">Chưa có tài liệu</h3>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
              Upload tài liệu (DOCX, PDF, ảnh) từ trang Dashboard Create để AI xử lý và lưu trữ tại đây.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card key={group.session_id} className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => setSelectedGroup(group)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="size-4 text-muted-foreground" />
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {group.file_count} files
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(group.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="space-y-1 mt-2">
                    {group.files.map((f) => (
                      <div key={f.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {typeIcon(f.file_type)}
                        <span className="truncate">{f.file_name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Trang {page} / {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="size-4" /> Trước</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Sau <ChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog — shows ALL files in the session */}
      <Dialog open={!!selectedGroup} onOpenChange={o => { if (!o) setSelectedGroup(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          {selectedGroup && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <FolderOpen className="size-5" />
                    {selectedGroup.file_count} files
                  </DialogTitle>
                </DialogHeader>

                {selectedGroup.files.map((doc) => (
                  <div key={doc.id} className="space-y-2 border rounded-lg p-4">
                    {/* Header: type + size + name */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        {typeIcon(doc.file_type)}
                        {doc.file_type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</span>
                    </div>
                    <p className="text-sm font-medium">{doc.file_name}</p>

                    {/* Image: show URL + preview */}
                    {doc.file_type === 'image' && doc.original_text && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground break-all bg-muted rounded p-2">
                          {doc.original_text}
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={doc.original_text} alt={doc.file_name}
                          className="max-h-60 rounded border object-contain bg-white" />
                      </div>
                    )}

                    {/* Docx/PDF: show AI summary + original text */}
                    {doc.file_type !== 'image' && (
                      <>
                        {doc.ai_summary && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Summary</h4>
                            <p className="text-sm leading-relaxed">{doc.ai_summary}</p>
                          </div>
                        )}
                        {doc.original_text && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Original Text</h4>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                              {doc.original_text.slice(0, 2000)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer buttons */}
              <div className="flex items-center gap-2 px-6 py-4 border-t bg-muted/30 shrink-0">
                <Button size="sm" className="gap-1.5" onClick={() => useForGeneration(selectedGroup)}>
                  <Sparkles className="size-3.5" /> Xử lí nội dung
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5"
                  onClick={async () => {
                    for (const f of selectedGroup.files) await deleteDoc(f.id);
                    setSelectedGroup(null);
                  }}>
                  <Trash2 className="size-3.5" /> Xóa tất cả
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

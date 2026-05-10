import { NextRequest, NextResponse } from 'next/server';
import { processAndStoreFiles } from '@/services/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files: File[] = [];

    for (const [_, value] of formData.entries()) {
      if (value instanceof File) files.push(value);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    console.log(`[Storage API] Processing ${files.length} files...`);
    const docs = await processAndStoreFiles(files);
    console.log(`[Storage API] Done: ${docs.length}/${files.length} files stored.`);

    return NextResponse.json({ documents: docs, total: files.length, stored: docs.length });
  } catch (err) {
    console.error('[Storage API] Upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';

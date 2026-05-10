import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const source = searchParams.get('source') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
  const offset = (page - 1) * limit;

  const supabase = createServiceSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from('crawled_articles')
    .select('*, crawl_sources!inner(name)', { count: 'exact' });

  if (search) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
  }

  if (source) {
    query = query.eq('crawl_sources.name', source);
  }

  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data, total: count ?? 0, page, limit });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('crawled_articles')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const runtime = 'nodejs';

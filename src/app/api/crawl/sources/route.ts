import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('crawl_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, feed_url, max_posts } = body;

  if (!name || !feed_url) {
    return NextResponse.json({ error: 'name and feed_url are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('crawl_sources')
    .insert({ name, feed_url, max_posts: max_posts ?? 10 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ source: data });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, name, feed_url, max_posts, enabled, auto_publish, auto_publish_platform, auto_publish_tone } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (feed_url !== undefined) updates.feed_url = feed_url;
  if (max_posts !== undefined) updates.max_posts = max_posts;
  if (enabled !== undefined) updates.enabled = enabled;
  if (auto_publish !== undefined) updates.auto_publish = auto_publish;
  if (auto_publish_platform !== undefined) updates.auto_publish_platform = auto_publish_platform;
  if (auto_publish_tone !== undefined) updates.auto_publish_tone = auto_publish_tone;

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('crawl_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ source: data });
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
    .from('crawl_sources')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export const runtime = 'nodejs';

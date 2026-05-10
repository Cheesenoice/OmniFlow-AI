import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get('platform') || 'facebook';
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('social_credentials')
    .select('*')
    .eq('platform', platform)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ credentials: data ?? null });
}

export async function POST(request: NextRequest) {
  const { platform, access_token, page_id } = await request.json();

  if (!platform) {
    return NextResponse.json({ error: 'platform is required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing } = await db
    .from('social_credentials')
    .select('id')
    .eq('platform', platform)
    .limit(1)
    .single();

  const payload = { platform, access_token: access_token ?? '', page_id: page_id ?? '' };

  let data;
  let error;
  if (existing) {
    const result = await db.from('social_credentials').update(payload).eq('id', existing.id).select().single();
    data = result.data;
    error = result.error;
  } else {
    const result = await db.from('social_credentials').insert(payload).select().single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ credentials: data });
}

export const runtime = 'nodejs';

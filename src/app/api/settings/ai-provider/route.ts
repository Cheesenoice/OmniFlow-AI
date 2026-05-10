import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('ai_config')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data ?? { provider: 'gemini' } });
}

export async function POST(request: NextRequest) {
  const { provider } = await request.json();

  if (!provider) {
    return NextResponse.json({ error: 'provider is required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing } = await db.from('ai_config').select('id').limit(1).single();

  let data;
  let error;
  if (existing) {
    const result = await db.from('ai_config').update({ provider }).eq('id', existing.id).select().single();
    data = result.data;
    error = result.error;
  } else {
    const result = await db.from('ai_config').insert({ provider }).select().single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ config: data });
}

export const runtime = 'nodejs';

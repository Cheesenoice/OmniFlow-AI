import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('email_settings')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data ?? null });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { smtp_host, smtp_port, smtp_user, smtp_pass, recipient_email, notify_on_publish } = body;

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing } = await db
    .from('email_settings')
    .select('id')
    .limit(1)
    .single();

  const payload: Record<string, unknown> = {};
  if (smtp_host !== undefined) payload.smtp_host = smtp_host;
  if (smtp_port !== undefined) payload.smtp_port = smtp_port;
  if (smtp_user !== undefined) payload.smtp_user = smtp_user;
  if (smtp_pass !== undefined) payload.smtp_pass = smtp_pass;
  if (recipient_email !== undefined) payload.recipient_email = recipient_email;
  if (notify_on_publish !== undefined) payload.notify_on_publish = notify_on_publish;

  let data;
  let error;

  if (existing) {
    const result = await db
      .from('email_settings')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    const result = await db
      .from('email_settings')
      .insert({ ...payload, smtp_host: smtp_host ?? 'smtp.gmail.com', smtp_port: smtp_port ?? 587 })
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ settings: data });
}

export const runtime = 'nodejs';

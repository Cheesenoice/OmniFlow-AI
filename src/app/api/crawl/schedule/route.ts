import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('crawl_schedules')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schedule: data ?? null });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    schedule_mode,
    interval_minutes,
    daily_time,
    weekly_day,
    weekly_time,
    monthly_day,
    monthly_time,
    enabled,
  } = body;

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check if schedule exists
  const { data: existing } = await db
    .from('crawl_schedules')
    .select('id')
    .limit(1)
    .single();

  const payload: Record<string, unknown> = {};
  if (schedule_mode !== undefined) payload.schedule_mode = schedule_mode;
  if (interval_minutes !== undefined) payload.interval_minutes = interval_minutes;
  if (daily_time !== undefined) payload.daily_time = daily_time;
  if (weekly_day !== undefined) payload.weekly_day = weekly_day;
  if (weekly_time !== undefined) payload.weekly_time = weekly_time;
  if (monthly_day !== undefined) payload.monthly_day = monthly_day;
  if (monthly_time !== undefined) payload.monthly_time = monthly_time;
  if (enabled !== undefined) payload.enabled = enabled;

  let data;
  let error;

  if (existing) {
    const result = await db
      .from('crawl_schedules')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    const result = await db
      .from('crawl_schedules')
      .insert({ ...payload, schedule_mode: schedule_mode ?? 'interval' })
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ schedule: data });
}

export const runtime = 'nodejs';

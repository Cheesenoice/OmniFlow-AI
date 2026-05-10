import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const fileType = searchParams.get('type') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
  const offset = (page - 1) * limit;

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get unique sessions with their latest timestamp and file count
  let sessionQuery = db
    .from('stored_documents')
    .select('session_id, created_at, file_name')
    .not('session_id', 'is', null);

  if (search) {
    sessionQuery = sessionQuery.or(
      `file_name.ilike.%${search}%,ai_summary.ilike.%${search}%,original_text.ilike.%${search}%`,
    );
  }

  if (fileType) {
    sessionQuery = sessionQuery.eq('file_type', fileType);
  }

  const { data: allRows, error: allError, count: totalCount } = await sessionQuery;

  if (allError) {
    return NextResponse.json({ error: allError.message }, { status: 500 });
  }

  // Group by session_id, pick latest created_at, count files
  const sessionMap = new Map<string, { created_at: string; count: number }>();
  for (const row of allRows || []) {
    const sid = row.session_id as string;
    if (!sid) continue;
    const existing = sessionMap.get(sid);
    if (!existing || row.created_at > existing.created_at) {
      sessionMap.set(sid, { created_at: row.created_at, count: (existing?.count || 0) + 1 });
    } else {
      existing.count++;
    }
  }

  // Sort sessions by latest created_at desc
  const sessions = Array.from(sessionMap.entries())
    .map(([session_id, info]) => ({ session_id, ...info }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const total = sessions.length;
  const pagedSessions = sessions.slice(offset, offset + limit);

  // Fetch full documents for each session
  const sessionIds = pagedSessions.map((s) => s.session_id);
  const { data: docs } = await db
    .from('stored_documents')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  // Group docs by session_id
  const docsBySession = new Map<string, unknown[]>();
  for (const doc of docs || []) {
    const sid = doc.session_id as string;
    if (!docsBySession.has(sid)) docsBySession.set(sid, []);
    docsBySession.get(sid)!.push(doc);
  }

  // Build response
  const groups = pagedSessions.map((s) => ({
    session_id: s.session_id,
    created_at: s.created_at,
    file_count: s.count,
    files: docsBySession.get(s.session_id) || [],
  }));

  return NextResponse.json({ groups, total, page, limit });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('stored_documents').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const runtime = 'nodejs';

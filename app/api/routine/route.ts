import { NextResponse } from 'next/server';
import { getSession } from '@/auth';
import { dbAvailable, loadRoutineItems, saveRoutineItems } from '@/lib/db';
import { sanitizeItems } from '@/lib/routine/custom';

export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ authenticated: false, dbConfigured: dbAvailable(), items: null });
  }
  let items = null;
  try {
    items = await loadRoutineItems(userId);
  } catch (e) {
    console.error('[api/routine] load failed', e);
  }
  return NextResponse.json({ authenticated: true, dbConfigured: dbAvailable(), items });
}

export async function PUT(req: Request) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!dbAvailable()) return NextResponse.json({ error: 'db_not_configured' }, { status: 503 });

  const body = await req.json().catch(() => null);
  const items = sanitizeItems((body as { items?: unknown } | null)?.items);
  if (!items) return NextResponse.json({ error: 'invalid_items' }, { status: 400 });

  try {
    await saveRoutineItems(userId, items);
  } catch (e) {
    console.error('[api/routine] save failed', e);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

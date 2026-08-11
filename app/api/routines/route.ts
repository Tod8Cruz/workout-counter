import { NextResponse } from 'next/server';
import { getSession } from '@/auth';
import { createRoutine, dbAvailable, listRoutines } from '@/lib/db';
import { sanitizeItems, sanitizeName } from '@/lib/routine/custom';

export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  try {
    const routines = await listRoutines(userId);
    return NextResponse.json({ dbConfigured: dbAvailable(), routines });
  } catch (e) {
    console.error('[api/routines] list failed', e);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!dbAvailable()) return NextResponse.json({ error: 'db_not_configured' }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { name?: unknown; items?: unknown } | null;
  const name = sanitizeName(body?.name);
  const items = sanitizeItems(body?.items);
  if (!name || !items) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  try {
    const id = await createRoutine(userId, name, items);
    return NextResponse.json({ id });
  } catch (e) {
    console.error('[api/routines] create failed', e);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
}

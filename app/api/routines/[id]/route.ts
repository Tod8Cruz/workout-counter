import { NextResponse } from 'next/server';
import { getSession } from '@/auth';
import { dbAvailable, deleteRoutine, getRoutine, updateRoutine } from '@/lib/db';
import { sanitizeItems, sanitizeName } from '@/lib/routine/custom';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await params;
  try {
    const routine = await getRoutine(userId, id);
    if (!routine) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ routine });
  } catch (e) {
    console.error('[api/routines/:id] get failed', e);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!dbAvailable()) return NextResponse.json({ error: 'db_not_configured' }, { status: 503 });
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as { name?: unknown; items?: unknown } | null;
  const name = sanitizeName(body?.name);
  const items = sanitizeItems(body?.items);
  if (!name || !items) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  try {
    const ok = await updateRoutine(userId, id, name, items);
    if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/routines/:id] update failed', e);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await params;
  try {
    await deleteRoutine(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/routines/:id] delete failed', e);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
}

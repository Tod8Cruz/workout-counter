import { createClient, type Client } from '@libsql/client';
import type { RoutineItem } from '@/lib/routine/custom';

export interface RoutineRecord {
  id: string;
  name: string;
  items: RoutineItem[];
  updatedAt: number;
}

let client: Client | null = null;
let schemaReady: Promise<unknown> | null = null;

export function dbAvailable(): boolean {
  return !!process.env.TURSO_DATABASE_URL;
}

function getClient(): Client {
  client ??= createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return client;
}

async function ensureSchema() {
  schemaReady ??= getClient().batch(
    [
      `CREATE TABLE IF NOT EXISTS user_routines (
         id TEXT PRIMARY KEY,
         user_id TEXT NOT NULL,
         name TEXT NOT NULL,
         items TEXT NOT NULL,
         created_at INTEGER NOT NULL,
         updated_at INTEGER NOT NULL
       )`,
      `CREATE INDEX IF NOT EXISTS idx_user_routines_user
         ON user_routines(user_id, updated_at DESC)`,
    ],
    'write',
  );
  await schemaReady;
}

function toRecord(row: Record<string, unknown>): RoutineRecord | null {
  try {
    return {
      id: String(row.id),
      name: String(row.name),
      items: JSON.parse(String(row.items)) as RoutineItem[],
      updatedAt: Number(row.updated_at),
    };
  } catch {
    return null;
  }
}

/** 구버전 단일 루틴 테이블(routines)에서 1회성 이관 */
async function migrateLegacy(userId: string): Promise<void> {
  try {
    const rs = await getClient().execute({
      sql: 'SELECT items FROM routines WHERE user_id = ?',
      args: [userId],
    });
    const row = rs.rows[0];
    if (!row) return;
    const now = Date.now();
    await getClient().batch(
      [
        {
          sql: `INSERT INTO user_routines (id, user_id, name, items, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [crypto.randomUUID(), userId, '내 루틴', String(row.items), now, now],
        },
        { sql: 'DELETE FROM routines WHERE user_id = ?', args: [userId] },
      ],
      'write',
    );
  } catch {
    // 구 테이블이 없으면 정상 — 이관할 것 없음
  }
}

/** 최신순 목록. 비어 있으면 구버전 데이터 이관을 시도한다 */
export async function listRoutines(userId: string): Promise<RoutineRecord[]> {
  if (!dbAvailable()) return [];
  await ensureSchema();
  const query = {
    sql: `SELECT id, name, items, updated_at FROM user_routines
          WHERE user_id = ? ORDER BY updated_at DESC`,
    args: [userId],
  };
  let rs = await getClient().execute(query);
  if (!rs.rows.length) {
    await migrateLegacy(userId);
    rs = await getClient().execute(query);
  }
  return rs.rows
    .map((r) => toRecord(r as unknown as Record<string, unknown>))
    .filter((r): r is RoutineRecord => r !== null);
}

export async function getRoutine(userId: string, id: string): Promise<RoutineRecord | null> {
  if (!dbAvailable()) return null;
  await ensureSchema();
  const rs = await getClient().execute({
    sql: `SELECT id, name, items, updated_at FROM user_routines WHERE user_id = ? AND id = ?`,
    args: [userId, id],
  });
  const row = rs.rows[0];
  return row ? toRecord(row as unknown as Record<string, unknown>) : null;
}

export async function createRoutine(
  userId: string,
  name: string,
  items: RoutineItem[],
): Promise<string> {
  await ensureSchema();
  const id = crypto.randomUUID();
  const now = Date.now();
  await getClient().execute({
    sql: `INSERT INTO user_routines (id, user_id, name, items, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, userId, name, JSON.stringify(items), now, now],
  });
  return id;
}

export async function updateRoutine(
  userId: string,
  id: string,
  name: string,
  items: RoutineItem[],
): Promise<boolean> {
  await ensureSchema();
  const rs = await getClient().execute({
    sql: `UPDATE user_routines SET name = ?, items = ?, updated_at = ?
          WHERE user_id = ? AND id = ?`,
    args: [name, JSON.stringify(items), Date.now(), userId, id],
  });
  return rs.rowsAffected > 0;
}

export async function deleteRoutine(userId: string, id: string): Promise<void> {
  await ensureSchema();
  await getClient().execute({
    sql: 'DELETE FROM user_routines WHERE user_id = ? AND id = ?',
    args: [userId, id],
  });
}

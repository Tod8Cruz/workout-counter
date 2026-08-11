import { createClient, type Client } from '@libsql/client';
import type { RoutineItem } from '@/lib/routine/custom';

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
  schemaReady ??= getClient().execute(
    `CREATE TABLE IF NOT EXISTS routines (
       user_id TEXT PRIMARY KEY,
       items TEXT NOT NULL,
       updated_at INTEGER NOT NULL
     )`,
  );
  await schemaReady;
}

export async function loadRoutineItems(userId: string): Promise<RoutineItem[] | null> {
  if (!dbAvailable()) return null;
  await ensureSchema();
  const rs = await getClient().execute({
    sql: 'SELECT items FROM routines WHERE user_id = ?',
    args: [userId],
  });
  const row = rs.rows[0];
  if (!row) return null;
  try {
    return JSON.parse(String(row.items)) as RoutineItem[];
  } catch {
    return null;
  }
}

export async function saveRoutineItems(userId: string, items: RoutineItem[]): Promise<void> {
  await ensureSchema();
  await getClient().execute({
    sql: `INSERT INTO routines (user_id, items, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at`,
    args: [userId, JSON.stringify(items), Date.now()],
  });
}

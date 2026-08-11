import type { SetResult } from '@/lib/routine/types';

export interface WorkoutSession {
  date: string; // ISO
  results: SetResult[];
}

const KEY = 'workout-sessions';

export function saveSession(results: SetResult[]) {
  if (typeof localStorage === 'undefined' || !results.length) return;
  try {
    const sessions = loadSessions();
    sessions.push({ date: new Date().toISOString(), results });
    localStorage.setItem(KEY, JSON.stringify(sessions.slice(-50)));
  } catch {
    // 저장 실패는 무시 (프라이빗 모드 등)
  }
}

export function loadSessions(): WorkoutSession[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as WorkoutSession[];
  } catch {
    return [];
  }
}

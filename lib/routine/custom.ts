import { EXERCISES, type ExerciseId } from '@/lib/detectors/registry';
import type { RoutineStep, Target } from './types';

/** 루틴 빌더에서 편집하는 단위. 좌우 운동은 저장 시엔 1항목, 실행 시 좌/우 교대로 펼쳐진다 */
export interface RoutineItem {
  exerciseId: ExerciseId;
  sets: number;
  /** 반복 운동이면 횟수, 홀드 운동이면 초 */
  value: number;
  restSec: number;
}

export const DEFAULT_ITEMS: RoutineItem[] = [
  { exerciseId: 'squat', sets: 3, value: 15, restSec: 60 },
  { exerciseId: 'pushup', sets: 3, value: 12, restSec: 60 },
  { exerciseId: 'row', sets: 3, value: 12, restSec: 60 },
  { exerciseId: 'deadhang', sets: 3, value: 25, restSec: 60 },
  { exerciseId: 'plank', sets: 3, value: 40, restSec: 60 },
  { exerciseId: 'sideplank', sets: 2, value: 30, restSec: 30 },
  { exerciseId: 'singleleg', sets: 2, value: 60, restSec: 30 },
];

function targetOf(kind: 'rep' | 'hold', value: number): Target {
  return kind === 'rep'
    ? { type: 'reps', min: value, max: value }
    : { type: 'hold', minMs: value * 1000, maxMs: value * 1000 };
}

/** 빌더 항목 → 실행용 스텝. 좌우 운동은 좌→우 교대 단계로 펼친다 */
export function expandRoutine(items: RoutineItem[]): RoutineStep[] {
  const steps: RoutineStep[] = [];
  for (const item of items) {
    const meta = EXERCISES[item.exerciseId];
    if (!meta) continue;
    if (meta.perSide) {
      for (let i = 0; i < item.sets; i++) {
        for (const side of ['left', 'right'] as const) {
          steps.push({
            exerciseId: item.exerciseId,
            side,
            sets: 1,
            restSec: item.restSec,
            target: targetOf(meta.kind, item.value),
          });
        }
      }
    } else {
      steps.push({
        exerciseId: item.exerciseId,
        sets: item.sets,
        restSec: item.restSec,
        target: targetOf(meta.kind, item.value),
      });
    }
  }
  return steps;
}

/** API 입력 검증. 유효하지 않으면 null */
export function sanitizeItems(raw: unknown): RoutineItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 30) return null;
  const items: RoutineItem[] = [];
  for (const r of raw) {
    if (typeof r !== 'object' || r === null) return null;
    const { exerciseId, sets, value, restSec } = r as Record<string, unknown>;
    if (typeof exerciseId !== 'string' || !(exerciseId in EXERCISES)) return null;
    const s = Number(sets);
    const v = Number(value);
    const rest = Number(restSec);
    if (!Number.isInteger(s) || s < 1 || s > 10) return null;
    if (!Number.isInteger(v) || v < 1 || v > 999) return null;
    if (!Number.isInteger(rest) || rest < 0 || rest > 600) return null;
    items.push({ exerciseId: exerciseId as ExerciseId, sets: s, value: v, restSec: rest });
  }
  return items;
}

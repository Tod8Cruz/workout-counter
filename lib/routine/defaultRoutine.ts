import type { RoutineStep } from './types';

/**
 * 기본 루틴. 좌우 구분 운동은 좌→우 교대 단계로 펼쳐서
 * 상태 머신은 단순하게 유지한다.
 */
export const DEFAULT_ROUTINE: RoutineStep[] = [
  { exerciseId: 'squat', sets: 3, target: { type: 'reps', min: 15, max: 15 }, restSec: 60 },
  { exerciseId: 'pushup', sets: 3, target: { type: 'reps', min: 10, max: 15 }, restSec: 60 },
  { exerciseId: 'row', sets: 3, target: { type: 'reps', min: 12, max: 12 }, restSec: 60 },
  { exerciseId: 'deadhang', sets: 3, target: { type: 'hold', minMs: 20000, maxMs: 30000 }, restSec: 60 },
  { exerciseId: 'plank', sets: 3, target: { type: 'hold', minMs: 30000, maxMs: 45000 }, restSec: 60 },
  { exerciseId: 'sideplank', side: 'left', sets: 1, target: { type: 'hold', minMs: 30000, maxMs: 30000 }, restSec: 30 },
  { exerciseId: 'sideplank', side: 'right', sets: 1, target: { type: 'hold', minMs: 30000, maxMs: 30000 }, restSec: 30 },
  { exerciseId: 'sideplank', side: 'left', sets: 1, target: { type: 'hold', minMs: 30000, maxMs: 30000 }, restSec: 30 },
  { exerciseId: 'sideplank', side: 'right', sets: 1, target: { type: 'hold', minMs: 30000, maxMs: 30000 }, restSec: 30 },
  { exerciseId: 'singleleg', side: 'left', sets: 1, target: { type: 'hold', minMs: 60000, maxMs: 60000 }, restSec: 30 },
  { exerciseId: 'singleleg', side: 'right', sets: 1, target: { type: 'hold', minMs: 60000, maxMs: 60000 }, restSec: 30 },
  { exerciseId: 'singleleg', side: 'left', sets: 1, target: { type: 'hold', minMs: 60000, maxMs: 60000 }, restSec: 30 },
  { exerciseId: 'singleleg', side: 'right', sets: 1, target: { type: 'hold', minMs: 60000, maxMs: 60000 }, restSec: 30 },
];

import type { ExerciseId } from '@/lib/detectors/registry';

export type Target =
  | { type: 'reps'; min: number; max: number }
  | { type: 'hold'; minMs: number; maxMs: number };

export interface RoutineStep {
  exerciseId: ExerciseId;
  sets: number;
  target: Target;
  restSec: number;
  side?: 'left' | 'right';
}

export type Phase = 'idle' | 'setup' | 'countdown' | 'active' | 'setdone' | 'rest' | 'done';

export interface SetResult {
  stepIdx: number;
  setIdx: number;
  exerciseId: ExerciseId;
  side?: 'left' | 'right';
  /** reps 또는 유지 ms */
  value: number;
}

export interface RoutineState {
  phase: Phase;
  stepIdx: number;
  setIdx: number;
  afterRest: 'nextSet' | 'nextStep';
  paused: boolean;
  results: SetResult[];
}

export type RoutineEvent =
  | { type: 'START' }
  | { type: 'BODY_READY' }
  | { type: 'COUNTDOWN_DONE' }
  | { type: 'SET_COMPLETE'; value: number }
  | { type: 'SET_DONE_ACK' }
  | { type: 'REST_DONE' }
  | { type: 'SKIP_EXERCISE' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

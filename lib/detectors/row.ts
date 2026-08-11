import { LM } from '@/lib/pose/landmarks';
import { jointAngle, pickBetterSide } from '@/lib/geometry/angles';
import { RepDetector } from './repStateMachine';
import type { ExerciseDetector, PoseFrame } from './types';

// 로우는 오클루전이 심해 베스트 에포트: visibility 기준을 낮추고 수동 보정 버튼과 병행
const CONFIG = { top: 150, bottom: 90, bottomExit: 110, minRepMs: 900, minVis: 0.35 };

const LEFT = [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST] as const;
const RIGHT = [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST] as const;

/** 팔꿈치 각도: 팔을 뻗으면(150+) → 당기면(<90) → 다시 뻗으면 1회 */
function elbowAngle(f: PoseFrame): number | null {
  if (!f.lm.length || !f.world.length) return null;
  const side = pickBetterSide(f.lm, LEFT, RIGHT);
  const [sh, el, wr] = side === 'left' ? LEFT : RIGHT;
  const vis = Math.min(f.lm[sh].visibility, f.lm[el].visibility, f.lm[wr].visibility);
  if (vis < CONFIG.minVis) return null;
  return jointAngle(f.world[sh], f.world[el], f.world[wr]);
}

export function createRowDetector(): ExerciseDetector {
  return new RepDetector('row', { metric: elbowAngle, ...CONFIG });
}

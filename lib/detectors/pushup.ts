import { LM } from '@/lib/pose/landmarks';
import { jointAngle, lineAngleToHorizontal, pickBetterSide } from '@/lib/geometry/angles';
import { RepDetector } from './repStateMachine';
import type { ExerciseDetector, PoseFrame } from './types';

const CONFIG = { top: 150, bottom: 95, bottomExit: 105, minRepMs: 700, minVis: 0.5 };

const LEFT = [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST] as const;
const RIGHT = [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST] as const;

/** 팔꿈치 각도 (측면 뷰). 몸이 수평이 아니면(서있음/무릎 자세) null → 카운트 안 함 */
function elbowAngle(f: PoseFrame): number | null {
  if (!f.lm.length || !f.world.length) return null;
  const side = pickBetterSide(f.lm, LEFT, RIGHT);
  const [sh, el, wr] = side === 'left' ? LEFT : RIGHT;
  const hip = side === 'left' ? LM.LEFT_HIP : LM.RIGHT_HIP;
  const vis = Math.min(f.lm[sh].visibility, f.lm[el].visibility, f.lm[wr].visibility);
  if (vis < CONFIG.minVis || f.lm[hip].visibility < 0.4) return null;
  // 어깨-엉덩이 라인이 수평에 가까울 때만 푸시업 자세로 인정
  if (lineAngleToHorizontal(f.lm[sh], f.lm[hip]) > 40) return null;
  return jointAngle(f.world[sh], f.world[el], f.world[wr]);
}

export function createPushupDetector(): ExerciseDetector {
  return new RepDetector('pushup', { metric: elbowAngle, ...CONFIG });
}

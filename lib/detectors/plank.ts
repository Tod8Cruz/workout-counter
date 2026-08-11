import { LM } from '@/lib/pose/landmarks';
import { jointAngle, lineAngleToHorizontal, pickBetterSide } from '@/lib/geometry/angles';
import { HoldDetector } from './holdEngine';
import type { ExerciseDetector, PoseFrame } from './types';

const LEFT = [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_ANKLE] as const;
const RIGHT = [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_ANKLE] as const;

/** 플랭크 판정: 어깨-엉덩이-발목 일직선 + 몸 수평 + 어깨가 팔꿈치 위 */
function isPlanking(f: PoseFrame): boolean | null {
  if (!f.lm.length || !f.world.length) return null;
  const side = pickBetterSide(f.lm, LEFT, RIGHT);
  const [sh, hip, ankle] = side === 'left' ? LEFT : RIGHT;
  const elbow = side === 'left' ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
  const vis = Math.min(f.lm[sh].visibility, f.lm[hip].visibility, f.lm[ankle].visibility);
  if (vis < 0.5) return null;

  const bodyStraight = jointAngle(f.world[sh], f.world[hip], f.world[ankle]) > 155;
  const bodyHorizontal = lineAngleToHorizontal(f.lm[sh], f.lm[ankle]) < 30;
  const shoulderAboveElbow =
    f.lm[elbow].visibility < 0.4 || f.lm[sh].y < f.lm[elbow].y;

  return bodyStraight && bodyHorizontal && shoulderAboveElbow;
}

export function createPlankDetector(): ExerciseDetector {
  return new HoldDetector('plank', {
    isHolding: isPlanking,
    startSustainMs: 500,
    graceMs: 1000,
    formHintKo: '몸을 일직선으로 유지하세요',
  });
}

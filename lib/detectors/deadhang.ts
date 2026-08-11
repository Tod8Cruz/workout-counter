import { LM } from '@/lib/pose/landmarks';
import { avgVisibility, jointAngle, lineAngleToHorizontal, mid } from '@/lib/geometry/angles';
import { HoldDetector } from './holdEngine';
import type { ExerciseDetector, PoseFrame } from './types';

const CORE = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_HIP, LM.RIGHT_HIP];

/** 매달림 판정: 양 손목이 어깨 위 + 팔꿈치 편 상태 + 몸통 수직 */
function isHanging(f: PoseFrame): boolean | null {
  if (!f.lm.length || !f.world.length) return null;
  if (avgVisibility(f.lm, CORE) < 0.4) return null;

  const wristsAbove =
    f.lm[LM.LEFT_WRIST].y < f.lm[LM.LEFT_SHOULDER].y - 0.05 &&
    f.lm[LM.RIGHT_WRIST].y < f.lm[LM.RIGHT_SHOULDER].y - 0.05;
  if (!wristsAbove) return false;

  // 팔꿈치가 보이면 팔을 편 상태인지도 확인
  let elbowsOk = true;
  if (f.lm[LM.LEFT_ELBOW].visibility >= 0.4 && f.lm[LM.RIGHT_ELBOW].visibility >= 0.4) {
    elbowsOk =
      jointAngle(f.world[LM.LEFT_SHOULDER], f.world[LM.LEFT_ELBOW], f.world[LM.LEFT_WRIST]) > 150 &&
      jointAngle(f.world[LM.RIGHT_SHOULDER], f.world[LM.RIGHT_ELBOW], f.world[LM.RIGHT_WRIST]) > 150;
  }

  const torsoVertical =
    lineAngleToHorizontal(
      mid(f.lm[LM.LEFT_SHOULDER], f.lm[LM.RIGHT_SHOULDER]),
      mid(f.lm[LM.LEFT_HIP], f.lm[LM.RIGHT_HIP]),
    ) > 65;

  return elbowsOk && torsoVertical;
}

export function createDeadhangDetector(): ExerciseDetector {
  return new HoldDetector('deadhang', { isHolding: isHanging, startSustainMs: 500, graceMs: 1500 });
}

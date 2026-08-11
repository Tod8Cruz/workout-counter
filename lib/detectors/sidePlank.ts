import { LM } from '@/lib/pose/landmarks';
import { jointAngle } from '@/lib/geometry/angles';
import { HoldDetector } from './holdEngine';
import type { ExerciseDetector, PoseFrame } from './types';

/**
 * 사이드 플랭크 판정: 지지 팔꿈치(화면에서 더 아래쪽) 위에 어깨가 쌓여 있고
 * 어깨-엉덩이-발목이 일직선. 좌/우 구분은 루틴 단계가 안내하고 여기선 자세만 본다.
 */
function isSidePlanking(f: PoseFrame): boolean | null {
  if (!f.lm.length || !f.world.length) return null;

  // 지지 측 = 더 낮은(화면 y가 큰) 팔꿈치
  const candidates = (['left', 'right'] as const).filter((s) => {
    const el = s === 'left' ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
    return f.lm[el].visibility >= 0.4;
  });
  if (!candidates.length) return null;
  const side =
    candidates.length === 1
      ? candidates[0]
      : f.lm[LM.LEFT_ELBOW].y > f.lm[LM.RIGHT_ELBOW].y
        ? 'left'
        : 'right';

  const [sh, el, hip, ankle] =
    side === 'left'
      ? [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_HIP, LM.LEFT_ANKLE]
      : [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_HIP, LM.RIGHT_ANKLE];
  const vis = Math.min(f.lm[sh].visibility, f.lm[hip].visibility, f.lm[ankle].visibility);
  if (vis < 0.4) return null;

  const bodyStraight = jointAngle(f.world[sh], f.world[hip], f.world[ankle]) > 150;
  const stacked = f.lm[sh].y < f.lm[el].y && Math.abs(f.lm[sh].x - f.lm[el].x) < 0.12;

  return bodyStraight && stacked;
}

export function createSidePlankDetector(): ExerciseDetector {
  return new HoldDetector('sideplank', {
    isHolding: isSidePlanking,
    startSustainMs: 500,
    graceMs: 1000,
    formHintKo: '엉덩이를 들어 올리세요',
  });
}

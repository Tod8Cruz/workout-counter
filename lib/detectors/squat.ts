import { LM } from '@/lib/pose/landmarks';
import { jointAngle } from '@/lib/geometry/angles';
import { RepDetector } from './repStateMachine';
import type { ExerciseDetector, PoseFrame } from './types';

// bottom 120: 하프 스쿼트 깊이도 1회로 인정 (100은 풀 스쿼트 수준이라 너무 빡셈)
const CONFIG = { top: 160, bottom: 120, bottomExit: 130, minRepMs: 700, minVis: 0.5 };

const LEGS: [number, number, number][] = [
  [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
];

/** 무릎 각도 (보이는 다리들의 평균). 서 있으면 ~175도, 스쿼트 바닥에서 <100도 */
function kneeAngle(f: PoseFrame): number | null {
  if (!f.lm.length || !f.world.length) return null;
  const angles: number[] = [];
  for (const [hip, knee, ankle] of LEGS) {
    const vis = Math.min(f.lm[hip].visibility, f.lm[knee].visibility, f.lm[ankle].visibility);
    if (vis < CONFIG.minVis) continue;
    angles.push(jointAngle(f.world[hip], f.world[knee], f.world[ankle]));
  }
  if (!angles.length) return null;
  return angles.reduce((a, b) => a + b, 0) / angles.length;
}

export function createSquatDetector(): ExerciseDetector {
  return new RepDetector('squat', { metric: kneeAngle, ...CONFIG });
}

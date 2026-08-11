import type { PoseFrame } from '@/lib/detectors/types';

/**
 * 운동에 필요한 랜드마크 체인 중 하나라도 전부 보이는지 확인.
 * 측면 뷰 운동은 좌/우 체인을 따로 넘겨 한쪽만 보여도 통과시킨다.
 */
export function fullBodyCheck(frame: PoseFrame, chains: number[][], minVis = 0.5): boolean {
  if (!frame.lm.length) return false;
  return chains.some((chain) => chain.every((i) => (frame.lm[i]?.visibility ?? 0) >= minVis));
}

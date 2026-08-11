import type { LandmarkPoint } from '@/lib/detectors/types';

/** b를 꼭짓점으로 하는 3D 관절 각도 (0~180도) */
export function jointAngle(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const m1 = Math.hypot(v1.x, v1.y, v1.z);
  const m2 = Math.hypot(v2.x, v2.y, v2.z);
  if (m1 === 0 || m2 === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** 두 점을 잇는 선분과 수평선 사이 각도 (0=수평, 90=수직). 정규화 좌표 기준 */
export function lineAngleToHorizontal(a: LandmarkPoint, b: LandmarkPoint): number {
  const deg = Math.abs((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
  return deg > 90 ? 180 - deg : deg;
}

export function dist2(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mid(a: LandmarkPoint, b: LandmarkPoint): LandmarkPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  };
}

export function avgVisibility(lm: LandmarkPoint[], ids: readonly number[]): number {
  if (!lm.length) return 0;
  let sum = 0;
  for (const i of ids) sum += lm[i]?.visibility ?? 0;
  return sum / ids.length;
}

/** 좌/우 체인 중 visibility가 높은 쪽 선택 */
export function pickBetterSide(
  lm: LandmarkPoint[],
  leftIds: readonly number[],
  rightIds: readonly number[],
): 'left' | 'right' {
  return avgVisibility(lm, leftIds) >= avgVisibility(lm, rightIds) ? 'left' : 'right';
}

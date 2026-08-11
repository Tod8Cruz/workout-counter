import type { LandmarkPoint } from '@/lib/detectors/types';

/** 랜드마크 좌표 EMA 스무딩. visibility는 스무딩하지 않고 통과시킨다 */
export class LandmarkSmoother {
  private prev: LandmarkPoint[] | null = null;

  constructor(private alpha = 0.5) {}

  apply(lm: LandmarkPoint[]): LandmarkPoint[] {
    const prev = this.prev;
    if (!prev || prev.length !== lm.length) {
      this.prev = lm.map((p) => ({ ...p }));
      return this.prev;
    }
    const a = this.alpha;
    const out = lm.map((p, i) => ({
      x: a * p.x + (1 - a) * prev[i].x,
      y: a * p.y + (1 - a) * prev[i].y,
      z: a * p.z + (1 - a) * prev[i].z,
      visibility: p.visibility,
    }));
    this.prev = out;
    return out;
  }

  reset() {
    this.prev = null;
  }
}

/** 단일 프레임 스파이크 제거용 미디언 윈도우 */
export class MedianWindow {
  private buf: number[] = [];

  constructor(private size = 3) {}

  push(v: number): number {
    this.buf.push(v);
    if (this.buf.length > this.size) this.buf.shift();
    const s = [...this.buf].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }

  reset() {
    this.buf.length = 0;
  }
}

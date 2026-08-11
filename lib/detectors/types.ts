export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseFrame {
  /** performance.now() 기준 ms */
  t: number;
  /** 정규화 좌표 (0~1, y는 아래로 증가). 포즈 미검출 시 빈 배열 */
  lm: LandmarkPoint[];
  /** 월드 좌표 (미터 단위) — 각도 계산용 */
  world: LandmarkPoint[];
  fps: number;
}

export type DetectorEvent =
  | { type: 'rep'; count: number }
  | { type: 'phase'; phase: string }
  | { type: 'holdStarted' }
  | { type: 'holdPaused'; reason: 'form' | 'confidence' }
  | { type: 'formHint'; messageKo: string }
  | { type: 'lowConfidence' }
  | { type: 'confidenceRestored' };

export interface DetectorState {
  kind: 'rep' | 'hold';
  reps: number;
  holdMs: number;
  holding: boolean;
  confident: boolean;
  debug: Record<string, number | string>;
}

export interface ExerciseDetector {
  readonly id: string;
  readonly kind: 'rep' | 'hold';
  update(frame: PoseFrame): DetectorEvent[];
  state(): DetectorState;
  /** 수동 보정 (+/- 횟수) */
  adjust(delta: number): void;
  /** 새 세트 시작 시 초기화 */
  reset(): void;
}

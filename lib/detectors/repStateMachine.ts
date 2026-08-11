import type { DetectorEvent, DetectorState, ExerciseDetector, PoseFrame } from './types';
import { MedianWindow } from '@/lib/pose/smoothing';

export interface RepConfig {
  /** 프레임에서 각도 등 단일 지표 추출. 오클루전/저신뢰 시 null */
  metric: (frame: PoseFrame) => number | null;
  /** metric >= top 이면 시작 자세 (예: 선 자세의 무릎 각도) */
  top: number;
  /** metric <= bottom 이면 바닥 자세 도달 */
  bottom: number;
  /** 바닥에서 metric >= bottomExit 이면 올라오기 시작 (히스테리시스) */
  bottomExit: number;
  /** 연속 카운트 최소 간격 ms (디바운스) */
  minRepMs?: number;
  /** null metric이 이 시간 지속되면 lowConfidence 이벤트 */
  lowConfMs?: number;
}

type RepPhase = 'top' | 'descending' | 'bottom' | 'ascending';

/** 히스테리시스 + 디바운스 기반 반복 카운터 상태 머신 */
export class RepDetector implements ExerciseDetector {
  readonly kind = 'rep' as const;
  private phase: RepPhase = 'top';
  private reps = 0;
  private lastRepT = 0;
  private confident = true;
  private lowSince: number | null = null;
  private median = new MedianWindow(3);
  private lastMetric: number | null = null;

  constructor(
    readonly id: string,
    private cfg: RepConfig,
  ) {}

  update(frame: PoseFrame): DetectorEvent[] {
    const events: DetectorEvent[] = [];
    const raw = this.cfg.metric(frame);

    if (raw == null) {
      this.lowSince ??= frame.t;
      if (this.confident && frame.t - this.lowSince > (this.cfg.lowConfMs ?? 500)) {
        this.confident = false;
        events.push({ type: 'lowConfidence' });
      }
      return events;
    }
    this.lowSince = null;
    if (!this.confident) {
      this.confident = true;
      events.push({ type: 'confidenceRestored' });
    }

    const m = this.median.push(raw);
    this.lastMetric = m;
    const { top, bottom, bottomExit } = this.cfg;

    switch (this.phase) {
      case 'top':
        if (m < top) this.phase = 'descending';
        break;
      case 'descending':
        if (m <= bottom) {
          this.phase = 'bottom';
          events.push({ type: 'phase', phase: 'bottom' });
        } else if (m >= top) {
          this.phase = 'top';
        }
        break;
      case 'bottom':
        if (m >= bottomExit) this.phase = 'ascending';
        break;
      case 'ascending':
        if (m >= top) {
          this.phase = 'top';
          if (frame.t - this.lastRepT >= (this.cfg.minRepMs ?? 700)) {
            this.reps++;
            this.lastRepT = frame.t;
            events.push({ type: 'rep', count: this.reps });
          }
        } else if (m <= bottom) {
          this.phase = 'bottom';
        }
        break;
    }
    return events;
  }

  state(): DetectorState {
    return {
      kind: 'rep',
      reps: this.reps,
      holdMs: 0,
      holding: false,
      confident: this.confident,
      debug: {
        metric: this.lastMetric != null ? Math.round(this.lastMetric) : -1,
        phase: this.phase,
      },
    };
  }

  adjust(delta: number) {
    this.reps = Math.max(0, this.reps + delta);
  }

  reset() {
    this.reps = 0;
    this.phase = 'top';
    this.lastRepT = 0;
    this.lowSince = null;
    this.confident = true;
    this.median.reset();
    this.lastMetric = null;
  }
}

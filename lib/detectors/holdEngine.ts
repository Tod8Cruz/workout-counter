import type { DetectorEvent, DetectorState, ExerciseDetector, PoseFrame } from './types';

export interface HoldConfig {
  /** true=자세 유지 중, false=자세 이탈, null=판정 불가(저신뢰) */
  isHolding: (frame: PoseFrame) => boolean | null;
  /** 타이머 시작 전 자세를 유지해야 하는 시간 */
  startSustainMs?: number;
  /** 자세 이탈을 허용하는 유예 시간 (유예 중에도 시간은 누적) */
  graceMs?: number;
  /** 자세 이탈 시 음성 힌트 (10초에 1번 스로틀) */
  formHintKo?: string;
}

/** 지속 조건 기반 홀드 타이머 (유예 시간 포함) */
export class HoldDetector implements ExerciseDetector {
  readonly kind = 'hold' as const;
  private holdMs = 0;
  private holding = false;
  private sustainStart: number | null = null;
  private graceStart: number | null = null;
  private lastT: number | null = null;
  private confident = true;
  private lowSince: number | null = null;
  private lastHintT = 0;
  private lastValue: boolean | null = null;

  constructor(
    readonly id: string,
    private cfg: HoldConfig,
  ) {}

  update(frame: PoseFrame): DetectorEvent[] {
    const events: DetectorEvent[] = [];
    // 탭 전환/일시정지 후 큰 시간 점프는 100ms로 캡
    const dt = this.lastT == null ? 0 : Math.min(frame.t - this.lastT, 100);
    this.lastT = frame.t;

    const v = this.cfg.isHolding(frame);
    this.lastValue = v;

    if (v == null) {
      this.lowSince ??= frame.t;
      if (this.confident && frame.t - this.lowSince > 500) {
        this.confident = false;
        events.push({ type: 'lowConfidence' });
      }
    } else {
      this.lowSince = null;
      if (!this.confident) {
        this.confident = true;
        events.push({ type: 'confidenceRestored' });
      }
    }

    if (v === true) {
      this.graceStart = null;
      if (!this.holding) {
        this.sustainStart ??= frame.t;
        if (frame.t - this.sustainStart >= (this.cfg.startSustainMs ?? 500)) {
          this.holding = true;
          events.push({ type: 'holdStarted' });
        }
      } else {
        this.holdMs += dt;
      }
    } else {
      this.sustainStart = null;
      if (this.holding) {
        this.graceStart ??= frame.t;
        if (frame.t - this.graceStart <= (this.cfg.graceMs ?? 1000)) {
          this.holdMs += dt; // 유예 중에도 누적 — 깜빡임으로 인한 초기화 방지
        } else {
          this.holding = false;
          this.graceStart = null;
          events.push({ type: 'holdPaused', reason: v === null ? 'confidence' : 'form' });
        }
        if (v === false && this.cfg.formHintKo && frame.t - this.lastHintT > 10000) {
          this.lastHintT = frame.t;
          events.push({ type: 'formHint', messageKo: this.cfg.formHintKo });
        }
      }
    }
    return events;
  }

  state(): DetectorState {
    return {
      kind: 'hold',
      reps: 0,
      holdMs: this.holdMs,
      holding: this.holding,
      confident: this.confident,
      debug: {
        holding: String(this.lastValue),
        holdSec: Math.round(this.holdMs / 100) / 10,
      },
    };
  }

  adjust(delta: number) {
    this.holdMs = Math.max(0, this.holdMs + delta * 1000);
  }

  reset() {
    this.holdMs = 0;
    this.holding = false;
    this.sustainStart = null;
    this.graceStart = null;
    this.lastT = null;
    this.confident = true;
    this.lowSince = null;
    this.lastValue = null;
  }
}

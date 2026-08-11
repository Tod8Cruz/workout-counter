import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import type { LandmarkPoint, PoseFrame } from '@/lib/detectors/types';
import { LandmarkSmoother } from './smoothing';

type MpLandmark = { x: number; y: number; z: number; visibility?: number };

function toPoint(l: MpLandmark): LandmarkPoint {
  return { x: l.x, y: l.y, z: l.z, visibility: l.visibility ?? 0 };
}

/**
 * MediaPipe Pose Landmarker 래퍼.
 * 반드시 클라이언트에서만 사용 — @mediapipe/tasks-vision은 동적 import로만 로드한다.
 */
export class PoseEngine {
  private landmarker: PoseLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private running = false;
  private rafId = 0;
  private lastTs = -1;
  private smoother = new LandmarkSmoother(0.5);
  private fps = 0;
  private fpsWindowStart = 0;
  private fpsCount = 0;

  async init(video: HTMLVideoElement): Promise<void> {
    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    const options = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate },
      runningMode: 'VIDEO' as const,
      numPoses: 1,
    });
    try {
      this.landmarker = await PoseLandmarker.createFromOptions(fileset, options('GPU'));
    } catch {
      this.landmarker = await PoseLandmarker.createFromOptions(fileset, options('CPU'));
    }
    this.video = video;
  }

  start(onFrame: (frame: PoseFrame) => void) {
    if (!this.landmarker || !this.video) throw new Error('PoseEngine not initialized');
    this.running = true;
    const video = this.video;

    const step = () => {
      if (!this.running) return;
      if (video.readyState >= 2 && !document.hidden) {
        // MediaPipe는 단조 증가 타임스탬프를 요구한다 (탭 복귀 후 역행 방지)
        let ts = performance.now();
        if (ts <= this.lastTs) ts = this.lastTs + 1;
        this.lastTs = ts;
        try {
          const res = this.landmarker!.detectForVideo(video, ts);
          const lmRaw = res.landmarks?.[0] ?? [];
          const worldRaw = res.worldLandmarks?.[0] ?? [];
          let lm: LandmarkPoint[];
          if (lmRaw.length) {
            lm = this.smoother.apply(lmRaw.map(toPoint));
          } else {
            this.smoother.reset();
            lm = [];
          }
          this.tickFps(ts);
          onFrame({ t: ts, lm, world: worldRaw.map(toPoint), fps: this.fps });
        } catch (e) {
          console.warn('[PoseEngine] detect error', e);
        }
      }
      schedule();
    };

    const schedule = () => {
      if (!this.running) return;
      const v = video as HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: () => void) => number;
      };
      if (typeof v.requestVideoFrameCallback === 'function') {
        v.requestVideoFrameCallback(step);
      } else {
        this.rafId = requestAnimationFrame(step);
      }
    };

    schedule();
  }

  private tickFps(ts: number) {
    this.fpsCount++;
    if (ts - this.fpsWindowStart >= 1000) {
      this.fps = Math.round((this.fpsCount * 1000) / (ts - this.fpsWindowStart));
      this.fpsWindowStart = ts;
      this.fpsCount = 0;
    }
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  destroy() {
    this.stop();
    this.landmarker?.close();
    this.landmarker = null;
  }
}

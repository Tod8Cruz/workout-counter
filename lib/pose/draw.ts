import type { PoseFrame } from '@/lib/detectors/types';
import { POSE_EDGES } from './landmarks';

export type PoseStatus = 'idle' | 'good' | 'warn';

const COLORS: Record<PoseStatus, string> = {
  idle: 'rgba(229, 229, 229, 0.85)',
  good: 'rgba(74, 222, 128, 0.95)',
  warn: 'rgba(251, 191, 36, 0.95)',
};

/**
 * object-fit: cover로 표시되는 비디오 위에 스켈레톤을 그린다.
 * 비디오/캔버스 모두 CSS로 미러링되므로 여기서는 원본 좌표계로 그린다.
 */
export function drawPose(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  frame: PoseFrame,
  status: PoseStatus,
) {
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || !frame.lm.length) return;

  // object-fit: cover 크롭 매핑
  const scale = Math.max(cw / vw, ch / vh);
  const offX = (cw - vw * scale) / 2;
  const offY = (ch - vh * scale) / 2;
  const px = (nx: number) => nx * vw * scale + offX;
  const py = (ny: number) => ny * vh * scale + offY;

  const color = COLORS[status];
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const [a, b] of POSE_EDGES) {
    const pa = frame.lm[a];
    const pb = frame.lm[b];
    if (!pa || !pb || pa.visibility < 0.5 || pb.visibility < 0.5) continue;
    ctx.beginPath();
    ctx.moveTo(px(pa.x), py(pa.y));
    ctx.lineTo(px(pb.x), py(pb.y));
    ctx.stroke();
  }

  for (let i = 11; i < frame.lm.length; i++) {
    const p = frame.lm[i];
    if (p.visibility < 0.5) continue;
    ctx.beginPath();
    ctx.arc(px(p.x), py(p.y), 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
}

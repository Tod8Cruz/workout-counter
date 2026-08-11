let ctx: AudioContext | null = null;

/** iOS는 사용자 제스처 안에서 AudioContext를 만들어/재개해야 소리가 난다 */
export function primeBeep() {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch {
    // Web Audio 미지원 — 무음으로 진행
  }
}

/** 깊이 달성 피드백용 "띵" — 880Hz 짧은 사인음 */
export function ding() {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

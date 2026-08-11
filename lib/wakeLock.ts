let sentinel: WakeLockSentinel | null = null;
let reacquireAttached = false;

export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    if (!reacquireAttached) {
      reacquireAttached = true;
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && sentinel !== null) {
          try {
            sentinel = await navigator.wakeLock.request('screen');
          } catch {
            /* 무시 */
          }
        }
      });
    }
  } catch {
    // 미지원/저전력 모드 — 무시
  }
}

export function releaseWakeLock() {
  sentinel?.release().catch(() => {});
  sentinel = null;
}

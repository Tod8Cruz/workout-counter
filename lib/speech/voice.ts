let koVoice: SpeechSynthesisVoice | null = null;
let listenerAttached = false;

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  koVoice = voices.find((v) => v.lang.startsWith('ko')) ?? null;
}

function ensureVoice() {
  if (koVoice || typeof speechSynthesis === 'undefined') return;
  pickVoice();
  if (!koVoice && !listenerAttached) {
    listenerAttached = true;
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }
}

/** iOS는 사용자 제스처 안에서 speak를 한 번 호출해야 이후 음성이 나온다 */
export function primeVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
    ensureVoice();
  } catch {
    // 미지원 브라우저 — 무음으로 진행
  }
}

/**
 * count: 빠른 반복 카운트 — 이미 말하는 중이면 버린다 (밀리지 않게)
 * announce: 안내 — 큐를 비우고 즉시 말한다
 */
export function speak(text: string, priority: 'count' | 'announce' = 'announce') {
  if (typeof speechSynthesis === 'undefined') return;
  ensureVoice();
  if (priority === 'count' && speechSynthesis.speaking) return;
  if (priority === 'announce') speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  if (koVoice) u.voice = koVoice;
  u.rate = priority === 'count' ? 1.15 : 1.0;
  speechSynthesis.speak(u);
}

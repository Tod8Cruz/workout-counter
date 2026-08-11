'use client';

import { useRouter } from 'next/navigation';

interface Props {
  paused: boolean;
  showSkipSet: boolean;
  onPauseToggle: () => void;
  onSkipSet: () => void;
  onSkipExercise: () => void;
}

export default function ControlBar({
  paused,
  showSkipSet,
  onPauseToggle,
  onSkipSet,
  onSkipExercise,
}: Props) {
  const router = useRouter();
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center gap-2 p-4">
      <button
        onClick={onPauseToggle}
        className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur active:bg-white/25"
      >
        {paused ? '▶ 재개' : '⏸ 일시정지'}
      </button>
      {showSkipSet && (
        <button
          onClick={onSkipSet}
          className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur active:bg-white/25"
        >
          세트 넘기기
        </button>
      )}
      <button
        onClick={onSkipExercise}
        className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur active:bg-white/25"
      >
        운동 넘기기
      </button>
      <button
        onClick={() => router.push('/')}
        className="rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-300 backdrop-blur active:bg-red-500/40"
      >
        종료
      </button>
    </div>
  );
}

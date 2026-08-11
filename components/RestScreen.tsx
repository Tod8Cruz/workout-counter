'use client';

interface Props {
  restLeft: number;
  nextLabel: string;
  onSkip: () => void;
}

export default function RestScreen({ restLeft, nextLabel, onSkip }: Props) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 p-6 backdrop-blur">
      <div className="mb-2 text-xl font-semibold text-neutral-300">휴식</div>
      <div className="text-[9rem] leading-none font-black tabular-nums text-green-400">
        {restLeft}
      </div>
      <div className="mt-6 text-lg text-neutral-300">
        다음: <span className="font-bold text-white">{nextLabel}</span>
      </div>
      <button
        onClick={onSkip}
        className="mt-8 rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold active:bg-white/20"
      >
        휴식 건너뛰기 →
      </button>
    </div>
  );
}

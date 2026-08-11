'use client';

import type { ExerciseMeta } from '@/lib/detectors/registry';
import { koSide } from '@/lib/speech/phrases.ko';

interface Props {
  meta: ExerciseMeta;
  side?: 'left' | 'right';
  bodyOk: boolean;
  onManualStart: () => void;
}

export default function SetupGuide({ meta, side, bodyOk, onManualStart }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 pb-24">
      <div className="pointer-events-auto mx-auto max-w-md rounded-3xl bg-black/70 p-6 backdrop-blur">
        <div className="mb-1 text-sm font-semibold text-green-400">다음 운동</div>
        <div className="mb-3 text-3xl font-black">
          {meta.cameraIcon} {koSide(side)}{meta.nameKo}
          <span className="ml-2 text-base font-medium text-neutral-400">{meta.purposeKo}</span>
        </div>
        <p className="mb-4 text-neutral-200">{meta.cameraSetupKo}</p>
        <div
          className={`mb-3 flex items-center gap-2 rounded-xl px-4 py-3 font-semibold ${
            bodyOk ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-neutral-300'
          }`}
        >
          <span
            className={`h-3 w-3 rounded-full ${bodyOk ? 'animate-pulse bg-green-400' : 'bg-neutral-500'}`}
          />
          {bodyOk ? '전신 인식됨 — 곧 시작합니다' : '전신이 보이도록 자세를 잡아 주세요'}
        </div>
        <button
          onClick={onManualStart}
          className="w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-neutral-300 active:bg-white/20"
        >
          인식을 건너뛰고 바로 시작
        </button>
      </div>
    </div>
  );
}

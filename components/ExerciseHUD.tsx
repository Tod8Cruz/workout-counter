'use client';

import type { DetectorState } from '@/lib/detectors/types';
import type { ExerciseMeta } from '@/lib/detectors/registry';
import type { RoutineStep } from '@/lib/routine/types';
import { koSide } from '@/lib/speech/phrases.ko';

interface Props {
  step: RoutineStep;
  meta: ExerciseMeta;
  setIdx: number;
  hud: DetectorState | null;
  onCompleteSet: () => void;
  onAdjust: (delta: number) => void;
}

export default function ExerciseHUD({ step, meta, setIdx, hud, onCompleteSet, onAdjust }: Props) {
  const target = step.target;
  const isRep = target.type === 'reps';
  const value = isRep ? (hud?.reps ?? 0) : Math.floor((hud?.holdMs ?? 0) / 1000);
  const targetLabel = isRep
    ? target.min === target.max
      ? `${target.max}회`
      : `${target.min}~${target.max}회`
    : target.minMs === target.maxMs
      ? `${Math.round(target.maxMs / 1000)}초`
      : `${Math.round(target.minMs / 1000)}~${Math.round(target.maxMs / 1000)}초`;
  const reachedMin = isRep ? value >= target.min : (hud?.holdMs ?? 0) >= target.minMs;
  const lowConf = hud != null && !hud.confident;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 pb-24">
      <div className="flex items-start justify-between">
        <div className="rounded-2xl bg-black/50 px-4 py-2 backdrop-blur">
          <div className="text-xl font-bold">
            {meta.cameraIcon} {koSide(step.side)}{meta.nameKo}
          </div>
          <div className="text-sm text-neutral-300">
            {setIdx + 1} / {step.sets}세트 · 목표 {targetLabel}
          </div>
        </div>
        {!isRep && (
          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold backdrop-blur ${
              hud?.holding ? 'bg-green-500/80 text-black' : 'bg-black/50 text-neutral-300'
            }`}
          >
            {hud?.holding ? '측정 중' : '자세를 잡으세요'}
          </div>
        )}
      </div>

      {lowConf && (
        <div className="mx-auto rounded-xl bg-amber-500/90 px-5 py-2 text-center font-semibold text-black">
          ⚠️ 인식이 어려워요 — 전신이 보이게 서 주세요
        </div>
      )}

      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[7rem] leading-none font-black tabular-nums drop-shadow-lg">
            {value}
            <span className="ml-2 text-3xl font-bold text-neutral-300">{isRep ? '회' : '초'}</span>
          </div>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-3">
          {(meta.manualAdjust || isRep) && (
            <div className="flex gap-2">
              <button
                onClick={() => onAdjust(-1)}
                className="h-14 w-14 rounded-full bg-white/15 text-2xl font-bold backdrop-blur active:bg-white/30"
              >
                −
              </button>
              <button
                onClick={() => onAdjust(1)}
                className="h-14 w-14 rounded-full bg-white/15 text-2xl font-bold backdrop-blur active:bg-white/30"
              >
                +
              </button>
            </div>
          )}
          {reachedMin && (
            <button
              onClick={onCompleteSet}
              className="rounded-2xl bg-green-500 px-6 py-3 text-lg font-bold text-black active:bg-green-400"
            >
              세트 완료 ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { EXERCISES } from '@/lib/detectors/registry';
import type { SetResult } from '@/lib/routine/types';
import { koSide } from '@/lib/speech/phrases.ko';

interface Props {
  results: SetResult[];
}

export default function SummaryScreen({ results }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-y-auto bg-neutral-950 p-6">
      <div className="mb-2 text-5xl">🎉</div>
      <h1 className="mb-6 text-3xl font-black">오늘 운동 완료!</h1>
      <div className="mb-8 w-full max-w-md space-y-2">
        {results.map((r, i) => {
          const meta = EXERCISES[r.exerciseId];
          const label =
            meta.kind === 'rep' ? `${r.value}회` : `${Math.round(r.value / 1000)}초`;
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
            >
              <span>
                {meta.cameraIcon} {koSide(r.side)}{meta.nameKo}{' '}
                <span className="text-sm text-neutral-400">{r.setIdx + 1}세트</span>
              </span>
              <span className="font-bold tabular-nums">{label}</span>
            </div>
          );
        })}
        {!results.length && <p className="text-center text-neutral-400">기록된 세트가 없습니다.</p>}
      </div>
      <Link
        href="/"
        className="rounded-2xl bg-green-500 px-10 py-4 text-lg font-bold text-black active:bg-green-400"
      >
        홈으로
      </Link>
    </div>
  );
}

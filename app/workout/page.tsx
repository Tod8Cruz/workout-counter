'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { DEFAULT_ROUTINE } from '@/lib/routine/defaultRoutine';
import { expandRoutine, sanitizeItems } from '@/lib/routine/custom';
import type { RoutineStep } from '@/lib/routine/types';

// MediaPipe는 브라우저 전용 — SSR을 완전히 끈다
const WorkoutScreen = dynamic(() => import('@/components/WorkoutScreen'), {
  ssr: false,
  loading: () => <Loading />,
});

function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-950 text-neutral-400">
      불러오는 중…
    </div>
  );
}

/** ?routine=<id> 지정 루틴 → 없으면 최신 루틴 → 없으면 기본 루틴 */
async function resolveSteps(): Promise<RoutineStep[]> {
  try {
    const id = new URLSearchParams(window.location.search).get('routine');
    if (id) {
      const res = await fetch(`/api/routines/${encodeURIComponent(id)}`);
      if (res.ok) {
        const d = await res.json();
        const items = sanitizeItems(d?.routine?.items);
        if (items) return expandRoutine(items);
      }
    }
    const res = await fetch('/api/routines');
    if (res.ok) {
      const d = await res.json();
      const items = sanitizeItems(d?.routines?.[0]?.items);
      if (items) return expandRoutine(items);
    }
  } catch {
    // 네트워크/인증 실패 — 기본 루틴으로
  }
  return DEFAULT_ROUTINE;
}

export default function WorkoutPage() {
  const [steps, setSteps] = useState<RoutineStep[] | null>(null);

  useEffect(() => {
    resolveSteps().then(setSteps);
  }, []);

  if (!steps) return <Loading />;
  return <WorkoutScreen steps={steps} />;
}

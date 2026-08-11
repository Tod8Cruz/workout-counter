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

export default function WorkoutPage() {
  const [steps, setSteps] = useState<RoutineStep[] | null>(null);

  // 로그인 사용자의 저장된 루틴을 불러오고, 없으면 기본 루틴
  useEffect(() => {
    fetch('/api/routine')
      .then((r) => r.json())
      .then((d) => {
        const items = sanitizeItems(d?.items);
        setSteps(items ? expandRoutine(items) : DEFAULT_ROUTINE);
      })
      .catch(() => setSteps(DEFAULT_ROUTINE));
  }, []);

  if (!steps) return <Loading />;
  return <WorkoutScreen steps={steps} />;
}

'use client';

import dynamic from 'next/dynamic';

// MediaPipe는 브라우저 전용 — SSR을 완전히 끈다
const WorkoutScreen = dynamic(() => import('@/components/WorkoutScreen'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-950 text-neutral-400">
      불러오는 중…
    </div>
  ),
});

export default function WorkoutPage() {
  return <WorkoutScreen />;
}

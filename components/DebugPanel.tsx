'use client';

import type { DetectorState } from '@/lib/detectors/types';
import type { Phase } from '@/lib/routine/types';

interface Props {
  fps: number;
  phase: Phase;
  hud: DetectorState | null;
}

export default function DebugPanel({ fps, phase, hud }: Props) {
  return (
    <div className="absolute right-2 top-2 z-40 rounded-lg bg-black/70 p-2 font-mono text-[11px] text-green-300">
      <div>fps: {fps}</div>
      <div>phase: {phase}</div>
      {hud &&
        Object.entries(hud.debug).map(([k, v]) => (
          <div key={k}>
            {k}: {String(v)}
          </div>
        ))}
    </div>
  );
}

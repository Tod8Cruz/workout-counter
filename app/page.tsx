import Link from "next/link";
import { DEFAULT_ROUTINE } from "@/lib/routine/defaultRoutine";
import { EXERCISES } from "@/lib/detectors/registry";
import type { RoutineStep } from "@/lib/routine/types";

function targetLabel(step: RoutineStep, count: number): string {
  const t = step.target;
  if (t.type === "reps") {
    const reps = t.min === t.max ? `${t.max}회` : `${t.min}~${t.max}회`;
    return `${reps} × ${count}`;
  }
  const sec =
    t.minMs === t.maxMs
      ? `${Math.round(t.maxMs / 1000)}초`
      : `${Math.round(t.minMs / 1000)}~${Math.round(t.maxMs / 1000)}초`;
  return `${sec} × ${count}`;
}

export default function Home() {
  // 좌우 교대로 펼쳐진 단계를 운동별로 묶어 표시
  const grouped: { step: RoutineStep; count: number }[] = [];
  for (const step of DEFAULT_ROUTINE) {
    const last = grouped[grouped.length - 1];
    if (last && last.step.exerciseId === step.exerciseId) {
      last.count += step.sets;
    } else {
      grouped.push({ step, count: step.sets });
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-6">
      <h1 className="mb-1 text-3xl font-black">💪 홈트 트래커</h1>
      <p className="mb-6 text-neutral-400">
        카메라가 자세를 인식해 자동으로 카운트하고 다음 운동을 안내합니다.
      </p>

      <div className="mb-8 space-y-2">
        {grouped.map(({ step, count }) => {
          const meta = EXERCISES[step.exerciseId];
          const perSide = step.side ? " (좌우)" : "";
          return (
            <div
              key={step.exerciseId}
              className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
            >
              <div>
                <div className="font-bold">
                  {meta.cameraIcon} {meta.nameKo}
                  {perSide}
                </div>
                <div className="text-sm text-neutral-400">{meta.purposeKo}</div>
              </div>
              <div className="font-semibold tabular-nums text-neutral-300">
                {targetLabel(step, count)}
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/workout"
        className="rounded-3xl bg-green-500 py-5 text-center text-2xl font-black text-black active:bg-green-400"
      >
        운동 시작
      </Link>
      <p className="mt-4 text-center text-xs text-neutral-500">
        영상은 기기 밖으로 전송되지 않습니다 · 폰을 세워 두고 2~3m 거리에서 사용하세요
      </p>
    </main>
  );
}

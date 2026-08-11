import Link from "next/link";
import { getSession, signOut } from "@/auth";
import { EXERCISES } from "@/lib/detectors/registry";
import { listRoutines, type RoutineRecord } from "@/lib/db";
import { DEFAULT_ITEMS, type RoutineItem } from "@/lib/routine/custom";
import { targetLabel } from "@/lib/routine/format";

export const dynamic = "force-dynamic";

function RoutineDetailList({ items }: { items: RoutineItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const meta = EXERCISES[item.exerciseId];
        return (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
          >
            <div>
              <div className="font-bold">
                {meta.cameraIcon} {meta.nameKo}
              </div>
              <div className="text-sm text-neutral-400">{meta.purposeKo}</div>
            </div>
            <div className="font-semibold tabular-nums text-neutral-300">
              {targetLabel(item)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function Home() {
  const session = await getSession();
  const userId = session?.user?.id;

  let routines: RoutineRecord[] = [];
  if (userId) {
    try {
      routines = await listRoutines(userId);
    } catch (e) {
      console.error("[home] routine list failed", e);
    }
  }
  const latest = routines[0] ?? null;
  const others = routines.slice(1);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-6">
      <div className="mb-1 flex items-start justify-between">
        <h1 className="text-3xl font-black">💪 홈트 트래커</h1>
        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button className="text-xs text-neutral-500 underline">
              {session.user.name ?? "사용자"} · 로그아웃
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black active:bg-neutral-200"
          >
            로그인
          </Link>
        )}
      </div>
      <p className="mb-6 text-neutral-400">
        카메라가 자세를 인식해 자동으로 카운트하고 다음 운동을 안내합니다.
      </p>

      {/* 최신 루틴 상세 + 운동 시작 */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold text-neutral-300">
          {latest ? latest.name : "기본 루틴"}
        </h2>
        <Link
          href={latest ? `/routine?id=${latest.id}` : "/routine"}
          className="text-sm text-green-400 underline"
        >
          {latest ? "편집" : "루틴 만들기"}
        </Link>
      </div>
      <RoutineDetailList items={latest?.items ?? DEFAULT_ITEMS} />

      <Link
        href={latest ? `/workout?routine=${latest.id}` : "/workout"}
        className="mt-6 rounded-3xl bg-green-500 py-5 text-center text-2xl font-black text-black active:bg-green-400"
      >
        운동 시작
      </Link>

      {/* 나머지 루틴 목록 */}
      {userId && (
        <div className="mt-10">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold text-neutral-300">내 루틴 목록</h2>
            <Link href="/routine" className="text-sm text-green-400 underline">
              + 새 루틴 만들기
            </Link>
          </div>
          {others.length ? (
            <div className="space-y-2">
              {others.map((r) => (
                <Link
                  key={r.id}
                  href={`/routines/${r.id}`}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 active:bg-white/10"
                >
                  <div>
                    <div className="font-bold">{r.name}</div>
                    <div className="text-sm text-neutral-400">
                      운동 {r.items.length}개 ·{" "}
                      {new Date(r.updatedAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                  <span className="text-neutral-500">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              {latest
                ? "다른 루틴이 없습니다. 새 루틴을 만들어 보세요."
                : "저장된 루틴이 없습니다. 루틴을 만들면 여기에 표시됩니다."}
            </p>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-neutral-500">
        영상은 기기 밖으로 전송되지 않습니다 · 폰을 세워 두고 2~3m 거리에서 사용하세요
      </p>
    </main>
  );
}

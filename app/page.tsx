import Link from "next/link";
import { getSession, signIn, signOut } from "@/auth";
import { EXERCISES } from "@/lib/detectors/registry";
import { loadRoutineItems } from "@/lib/db";
import { DEFAULT_ITEMS, type RoutineItem } from "@/lib/routine/custom";

export const dynamic = "force-dynamic";

function targetLabel(item: RoutineItem): string {
  const meta = EXERCISES[item.exerciseId];
  const unit = meta.kind === "rep" ? "회" : "초";
  return `${item.value}${unit} × ${item.sets}${meta.perSide ? " (좌우)" : ""}`;
}

export default async function Home() {
  const session = await getSession();
  const userId = session?.user?.id;

  let items: RoutineItem[] | null = null;
  if (userId) {
    try {
      items = await loadRoutineItems(userId);
    } catch (e) {
      console.error("[home] routine load failed", e);
    }
  }
  const routine = items ?? DEFAULT_ITEMS;

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
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black active:bg-neutral-200">
              Google 로그인
            </button>
          </form>
        )}
      </div>
      <p className="mb-6 text-neutral-400">
        카메라가 자세를 인식해 자동으로 카운트하고 다음 운동을 안내합니다.
      </p>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold text-neutral-300">
          {items ? "내 루틴" : "기본 루틴"}
        </h2>
        <Link href="/routine" className="text-sm text-green-400 underline">
          루틴 편집
        </Link>
      </div>
      <div className="mb-8 space-y-2">
        {routine.map((item, i) => {
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

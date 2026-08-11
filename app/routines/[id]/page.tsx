import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/auth";
import { getRoutine } from "@/lib/db";
import { EXERCISES } from "@/lib/detectors/registry";
import DeleteRoutineButton from "@/components/DeleteRoutineButton";
import { targetLabel } from "@/lib/routine/format";

export const dynamic = "force-dynamic";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) redirect(`/login?next=/routines/${id}`);

  const routine = await getRoutine(userId, id).catch(() => null);
  if (!routine) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-400 underline">
          ← 홈으로
        </Link>
        <Link
          href={`/routine?id=${routine.id}`}
          className="text-sm text-green-400 underline"
        >
          편집
        </Link>
      </div>

      <h1 className="mb-1 text-3xl font-black">{routine.name}</h1>
      <p className="mb-6 text-sm text-neutral-400">
        운동 {routine.items.length}개 · 마지막 수정{" "}
        {new Date(routine.updatedAt).toLocaleDateString("ko-KR")}
      </p>

      <div className="mb-8 space-y-2">
        {routine.items.map((item, i) => {
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
        href={`/workout?routine=${routine.id}`}
        className="rounded-3xl bg-green-500 py-5 text-center text-2xl font-black text-black active:bg-green-400"
      >
        운동 시작
      </Link>
      <div className="mt-4 flex justify-center">
        <DeleteRoutineButton id={routine.id} name={routine.name} />
      </div>
    </main>
  );
}

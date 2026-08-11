'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EXERCISES, type ExerciseId } from '@/lib/detectors/registry';
import { DEFAULT_ITEMS, type RoutineItem } from '@/lib/routine/custom';

type LoadState = 'loading' | 'ready' | 'unauthenticated' | 'notfound';

const EXERCISE_IDS = Object.keys(EXERCISES) as ExerciseId[];

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-neutral-400">
      {label}
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Math.round(Number(e.target.value));
          if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="w-16 rounded-lg bg-white/10 px-2 py-2 text-center text-base font-semibold text-white"
      />
    </label>
  );
}

function RoutineBuilder() {
  const router = useRouter();
  const editId = useSearchParams().get('id');
  const [state, setState] = useState<LoadState>('loading');
  const [name, setName] = useState('내 루틴');
  const [items, setItems] = useState<RoutineItem[]>(DEFAULT_ITEMS);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (editId) {
        const res = await fetch(`/api/routines/${editId}`).catch(() => null);
        if (!res) return setState('unauthenticated');
        if (res.status === 401) return setState('unauthenticated');
        if (!res.ok) return setState('notfound');
        const d = await res.json();
        setName(d.routine.name);
        setItems(d.routine.items);
        setState('ready');
      } else {
        // 새 루틴 — 로그인 여부만 확인
        const res = await fetch('/api/routines').catch(() => null);
        if (!res || res.status === 401) return setState('unauthenticated');
        setState('ready');
      }
    };
    load();
  }, [editId]);

  const update = (idx: number, patch: Partial<RoutineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const move = (idx: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const save = async () => {
    if (!name.trim()) {
      setNotice('루틴 이름을 입력해 주세요');
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(editId ? `/api/routines/${editId}` : '/api/routines', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), items }),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
        return;
      }
      if (res.status === 401) setNotice('로그인이 필요합니다');
      else if (res.status === 503) setNotice('DB가 설정되지 않았습니다');
      else setNotice('저장에 실패했습니다');
    } catch {
      setNotice('저장에 실패했습니다');
    }
    setSaving(false);
  };

  if (state === 'loading') {
    return (
      <main className="flex min-h-dvh items-center justify-center text-neutral-400">
        불러오는 중…
      </main>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-black">루틴 만들기는 로그인이 필요해요</h1>
        <p className="text-neutral-400">내 루틴을 저장하고 어느 기기에서든 불러올 수 있습니다.</p>
        <Link
          href={`/login?next=${encodeURIComponent(editId ? `/routine?id=${editId}` : '/routine')}`}
          className="rounded-2xl bg-white px-8 py-3 font-bold text-black active:bg-neutral-200"
        >
          로그인하러 가기
        </Link>
        <Link href="/" className="text-sm text-neutral-500 underline">
          홈으로
        </Link>
      </main>
    );
  }

  if (state === 'notfound') {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-black">루틴을 찾을 수 없습니다</h1>
        <Link href="/" className="text-sm text-neutral-400 underline">
          홈으로
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-6 pb-32">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">{editId ? '루틴 편집' : '새 루틴 만들기'}</h1>
        <Link href="/" className="text-sm text-neutral-400 underline">
          홈으로
        </Link>
      </div>

      <label className="mb-5 flex flex-col gap-1 text-xs text-neutral-400">
        루틴 이름
        <input
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 아침 루틴"
          className="rounded-xl bg-white/10 px-4 py-3 text-lg font-bold text-white"
        />
      </label>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const meta = EXERCISES[item.exerciseId];
          return (
            <div key={idx} className="rounded-2xl bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <select
                  value={item.exerciseId}
                  onChange={(e) =>
                    e.target.value && update(idx, { exerciseId: e.target.value as ExerciseId })
                  }
                  className="flex-1 rounded-lg bg-white/10 px-3 py-2 font-bold text-white"
                >
                  {EXERCISE_IDS.map((id) => (
                    <option key={id} value={id} className="bg-neutral-900">
                      {EXERCISES[id].cameraIcon} {EXERCISES[id].nameKo}
                      {EXERCISES[id].perSide ? ' (좌우)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="h-9 w-9 rounded-lg bg-white/10 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  className="h-9 w-9 rounded-lg bg-white/10 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={items.length <= 1}
                  className="h-9 w-9 rounded-lg bg-red-500/20 text-red-300 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-end gap-4">
                <NumberField
                  label={meta.perSide ? '세트 (좌우 각)' : '세트'}
                  value={item.sets}
                  min={1}
                  max={10}
                  onChange={(v) => update(idx, { sets: v })}
                />
                <NumberField
                  label={meta.kind === 'rep' ? '횟수' : '초'}
                  value={item.value}
                  min={1}
                  max={999}
                  onChange={(v) => update(idx, { value: v })}
                />
                <NumberField
                  label="휴식(초)"
                  value={item.restSec}
                  min={0}
                  max={600}
                  onChange={(v) => update(idx, { restSec: v })}
                />
                <span className="ml-auto text-xs text-neutral-500">{meta.purposeKo}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() =>
          setItems((prev) => [...prev, { exerciseId: 'squat', sets: 3, value: 10, restSec: 60 }])
        }
        className="mt-4 rounded-2xl border border-dashed border-white/20 py-3 font-semibold text-neutral-300 active:bg-white/10"
      >
        + 운동 추가
      </button>
      <button
        onClick={() => setItems(DEFAULT_ITEMS)}
        className="mt-2 py-2 text-sm text-neutral-500 underline"
      >
        기본 루틴으로 되돌리기
      </button>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-neutral-950/90 p-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          {notice && <span className="text-sm text-amber-300">{notice}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="ml-auto rounded-2xl bg-green-500 px-8 py-3 font-black text-black active:bg-green-400 disabled:opacity-40"
          >
            {saving ? '저장 중…' : editId ? '저장' : '루틴 만들기'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function RoutinePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-neutral-400">
          불러오는 중…
        </main>
      }
    >
      <RoutineBuilder />
    </Suspense>
  );
}

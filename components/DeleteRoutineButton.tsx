'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteRoutineButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!confirm(`"${name}" 루틴을 삭제할까요?`)) return;
    setBusy(true);
    const res = await fetch(`/api/routines/${id}`, { method: 'DELETE' }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      router.push('/');
      router.refresh();
    } else {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <button
      onClick={remove}
      disabled={busy}
      className="rounded-2xl bg-red-500/15 px-6 py-3 font-bold text-red-300 active:bg-red-500/30 disabled:opacity-50"
    >
      {busy ? '삭제 중…' : '삭제'}
    </button>
  );
}

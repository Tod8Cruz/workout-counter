import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, signIn } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // 오픈 리다이렉트 방지 — 내부 경로만 허용
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const session = await getSession();
  if (session?.user) redirect(target);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="text-6xl">💪</div>
      <div>
        <h1 className="mb-2 text-3xl font-black">홈트 트래커</h1>
        <p className="text-neutral-400">
          로그인하면 나만의 운동 루틴을 만들고
          <br />
          어느 기기에서든 불러올 수 있어요.
        </p>
      </div>
      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: target });
        }}
        className="w-full"
      >
        <button className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-lg font-bold text-black active:bg-neutral-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.7-5l-3.9 3C3.4 21.3 7.4 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.4c-.3-.8-.4-1.6-.4-2.4s.1-1.6.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.4 5.4l3.9-3z"
            />
            <path
              fill="#EA4335"
              d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l3.9 3c.9-2.9 3.6-4.9 6.7-4.9z"
            />
          </svg>
          Google로 계속하기
        </button>
      </form>
      <Link href="/" className="text-sm text-neutral-500 underline">
        로그인 없이 기본 루틴으로 운동하기
      </Link>
    </main>
  );
}

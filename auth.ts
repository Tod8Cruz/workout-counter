import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET 은 .env에서 자동으로 읽힌다.
// DB 어댑터 없이 JWT 세션 — 사용자 식별은 Google sub(token.sub)로 한다.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: '/login' },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

/** env 미설정 상태에서도 페이지가 죽지 않게 하는 안전 래퍼 */
export async function getSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

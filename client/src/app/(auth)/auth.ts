import { User } from '@/types';
import NextAuth from 'next-auth';
import Github from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

async function getUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<User | undefined> {
  return undefined;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Github, Google],
  session: {
    strategy: 'jwt',
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) session.userId = token.userId as string;
      return session;
    },
  },
});

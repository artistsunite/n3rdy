import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
  interface JWT {
    googleId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, account }) {
      // On first sign-in, account is populated — capture the Google account ID.
      // account.providerAccountId is Google's stable numeric user ID (e.g. "117...").
      // token.sub in NextAuth v5 beta can be a random UUID; we override it here
      // so every sign-in for the same Google account yields the same user ID.
      if (account?.providerAccountId) {
        token.googleId = account.providerAccountId;
        token.sub = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = (token.googleId as string | undefined) ?? token.sub ?? session.user.email ?? '';
      return session;
    },
    authorized({ auth }) {
      return !!auth;
    },
  },
});

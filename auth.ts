import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';

// Augment Session so session.user.id is properly typed across all routes
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
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
    session({ session, token }) {
      // token.sub is the Google account ID — always present for OAuth users
      session.user.id = token.sub ?? session.user.email ?? '';
      return session;
    },
    authorized({ auth }) {
      return !!auth;
    },
  },
});

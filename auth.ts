import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

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
    jwt({ token, user }) {
      // Persist the user ID (Google account sub) into the JWT on first sign-in
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      // Expose the ID on session.user so API routes can use it as a Firestore doc key
      if (session.user) {
        (session.user as typeof session.user & { id: string }).id =
          ((token.id ?? token.sub) as string) ?? session.user.email ?? '';
      }
      return session;
    },
    authorized({ auth }) {
      return !!auth;
    },
  },
});

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";
import type { Adapter } from "next-auth/adapters";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback:", { userId: user?.id, provider: account?.provider });
      return true;
    },
    async session({ session, user }) {
      try {
        if (session.user) {
          session.user.id = user.id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session.user as any).onboardingComplete = (user as any).onboardingComplete ?? false;
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },
  },
});

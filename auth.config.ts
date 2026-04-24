import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  pages: {
    signIn: "/signin",
    newUser: "/onboarding/role",
    verifyRequest: "/signin/verify",
    error: "/signin",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // See auth.ts — allowDangerousEmailAccountLinking intentionally off
      // to prevent cross-account session hijacks (SHK-038).
    }),
    // Credentials provider is wired up in auth.ts (needs Prisma / bcrypt which
    // are node-runtime-only; we keep this config edge-compatible here.)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize implementation lives in auth.ts
      authorize: async () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes
      const publicPaths = [
        "/",
        "/signin",
        "/signup",
        "/verify",
        "/explore",
        "/m",
        "/l",
        "/emails",
        "/privacy",
        "/terms",
        "/help",
        "/api/auth",
        "/api/health",
        "/api/e2e-reset",
        "/_next",
        "/favicon.ico",
        "/icons",
        "/manifest.webmanifest",
        "/sw.js",
      ];
      const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
      if (isPublic) return true;

      // Protected
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub;
        token.role = (user as { defaultRole?: string }).defaultRole ?? token.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub!;
        session.user.role = (token.role as "OWNER" | "MEMBER") ?? "MEMBER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

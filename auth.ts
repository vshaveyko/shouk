import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Intentionally NOT using allowDangerousEmailAccountLinking (SHK-038):
      // with it enabled, signing in with a second Gmail that happens to
      // share an email substring with an existing credentials user could
      // silently hijack that user's session. Each Google identity should
      // map to its own User row unless explicitly linked via the verify
      // flow.
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.name ?? email,
          image: user.image,
          defaultRole: user.defaultRole,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      // When OAuth creates a new user, ensure their email is treated as verified
      // and set a default displayName.
      if (!user.email) return;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          displayName: user.name ?? user.email.split("@")[0],
        },
      });
    },
    async linkAccount({ user, account }) {
      // When an OAuth account is linked to a user, record a matching
      // VerifiedAccount entry so the verify-panel recognises it as a real
      // link (SHK-031) and uses the real email as the handle rather than
      // a fabricated one (SHK-032). We only do this for providers we
      // actually support in the UI.
      if (!user.id) return;
      const providerMap: Record<string, "GOOGLE" | undefined> = {
        google: "GOOGLE",
      };
      const providerEnum = providerMap[account.provider];
      if (!providerEnum) return;
      const handle = (user.email ?? "").toString();
      if (!handle) return;
      await prisma.verifiedAccount.upsert({
        where: {
          userId_provider: { userId: user.id, provider: providerEnum },
        },
        update: { handle, verifiedAt: new Date() },
        create: { userId: user.id, provider: providerEnum, handle },
      });
    },
    async signIn({ user, account }) {
      // Back-stop for the first sign-in (no linkAccount fires when the
      // account already exists from a prior session). Mirror the
      // linkAccount logic above so the VerifiedAccount stays in sync
      // even after re-authenticating with Google.
      if (!user.id || !account) return;
      if (account.provider !== "google") return;
      const handle = (user.email ?? "").toString();
      if (!handle) return;
      await prisma.verifiedAccount.upsert({
        where: { userId_provider: { userId: user.id, provider: "GOOGLE" } },
        update: { handle, verifiedAt: new Date() },
        create: { userId: user.id, provider: "GOOGLE", handle },
      });
    },
  },
});

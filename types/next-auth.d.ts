import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OWNER" | "MEMBER";
    } & DefaultSession["user"];
  }

  interface User {
    defaultRole?: "OWNER" | "MEMBER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "OWNER" | "MEMBER";
  }
}

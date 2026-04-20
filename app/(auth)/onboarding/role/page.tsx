import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RolePicker } from "./RolePicker";

export const metadata = { title: "Welcome" };

export default async function RolePickerPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/onboarding/role");

  return (
    <main className="min-h-[calc(100vh-64px)] grid place-items-center py-12 px-4">
      <div className="w-full max-w-[720px] text-center">
        <p className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-3">
          Welcome, {session.user.name?.split(" ")[0] ?? "friend"}
        </p>
        <h1 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.03em] mb-3">
          How will you use <span className="serif italic text-blue">Shouks</span>?
        </h1>
        <p className="text-[15px] text-ink-soft mb-8 max-w-[520px] mx-auto">
          Pick what you'll do first. You can always do both — this just sets what we show you on the home screen.
        </p>
        <RolePicker />
      </div>
    </main>
  );
}

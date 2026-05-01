import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VerificationPanel } from "./VerificationPanel";

export const metadata = { title: "Verify your identity" };

export default async function VerifyPage(
  props: {
    searchParams?: Promise<{ redirect?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/onboarding/verify");

  const verified = await prisma.verifiedAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { verifiedAt: "desc" },
  });

  const userPhone = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneNumber: true, phoneVerified: true },
  });

  const next = searchParams?.redirect ?? "/home";

  return (
    <main className="min-h-[calc(100vh-64px)] py-12 px-4">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="text-center mb-8">
          <p className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-3">Step 2</p>
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] mb-3">
            Verify your <span className="serif italic text-blue">identity</span>
          </h1>
          <p className="text-[15px] text-ink-soft max-w-[480px] mx-auto">
            Link accounts you already use. Most marketplaces require at least one. You can do this later — but verifying now unlocks applications.
          </p>
        </div>
        <VerificationPanel
          initial={verified.map((v) => ({ provider: v.provider, handle: v.handle }))}
          phone={userPhone}
          phoneEnabled={
            process.env.NODE_ENV !== "production" ||
            Boolean(process.env.SHOUKS_SMS_PROVIDER)
          }
          nextHref={next}
        />
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RolePicker } from "./RolePicker";
import { i18n } from '@shipeasy/sdk/client'

export const metadata = { title: i18n.t('...role.page.welcome') };

export default async function RolePickerPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/onboarding/role");

  return (
    <main className="min-h-[calc(100vh-64px)] grid place-items-center py-12 px-4">
      <div className="w-full max-w-[720px] text-center">
        <p className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-3">
          {i18n.t('...role.page.welcome2')} {session.user.name?.split(" ")[0] ?? "friend"}
        </p>
        <h1 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.03em] mb-3">
          {i18n.t('...role.page.howWillYouUse')} <span className="serif italic text-blue">{i18n.t('common.shouks')}</span>?
        </h1>
        <p className="text-[15px] text-ink-soft mb-8 max-w-[520px] mx-auto">
          {i18n.t('...role.page.pickWhatYoullDoFirst')}
        </p>
        <RolePicker />
      </div>
    </main>
  );
}

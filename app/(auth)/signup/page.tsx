import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "./SignUpForm";
import { i18n } from '@shipeasy/sdk/client'

export const metadata = { title: i18n.t('common.createYourAccount') };

export default function SignUpPage() {
  // V1 creates accounts implicitly on first OAuth sign-in (SHK-019).
  // If the credentials flow isn't enabled, bounce signup requests to the
  // signin page where the OAuth button lives. Set
  // SHOUKS_ENABLE_CREDENTIALS_AUTH=1 to surface the form again.
  if (process.env.SHOUKS_ENABLE_CREDENTIALS_AUTH !== "1") {
    redirect("/signin");
  }

  return (
    <main className="min-h-[calc(100vh-64px)] grid place-items-center py-12 px-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-surface border border-line rounded-[14px] shadow p-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] mb-1.5">
            {i18n.t('...signup.page.createYour')} <span className="serif italic text-blue">account</span>
          </h1>
          <p className="text-[14px] text-ink-soft mb-7">
            {i18n.t('...signup.page.oneAccountForEveryMarketplace')}
          </p>
          <SignUpForm />
          <p className="mt-6 text-center text-[13px] text-muted">
            {i18n.t('...signup.page.alreadyHaveAnAccount')}{" "}
            <Link href="/signin" className="text-blue-ink hover:underline font-medium">
              {i18n.t('common.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

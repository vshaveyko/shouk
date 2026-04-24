import Link from "next/link";
import { signIn } from "@/auth";
import { ShouksMark } from "@/components/brand/Logo";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in" };

export default function SignInPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; error?: string };
}) {
  const callbackUrl = searchParams?.callbackUrl ?? "/home";
  const error = searchParams?.error;

  // V1 is OAuth-only (SHK-019). The credentials provider stays wired up in
  // auth.ts so we can re-enable the email/password form later without a
  // redeploy — e2e tests opt in via SHOUKS_ENABLE_CREDENTIALS_AUTH=1.
  const credentialsEnabled = process.env.SHOUKS_ENABLE_CREDENTIALS_AUTH === "1";

  async function googleSignIn() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  }

  return (
    <main className="min-h-[calc(100vh-64px)] grid place-items-center py-12 px-4 bg-bg-soft">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-2.5 mb-7 text-[18px] font-semibold tracking-[-0.02em]">
          <ShouksMark size={28} />
          <span>Shouks</span>
        </div>
        <div className="bg-surface border border-line rounded-[18px] p-8" style={{ boxShadow: "0 1px 0 oklch(0.9 0.008 240 / 0.5), 0 20px 48px -24px oklch(0.1 0.03 240 / 0.2)" }}>
          <h1 className="serif text-[32px] leading-[1.1] tracking-[-0.01em] mb-1.5" style={{ fontWeight: 400 }}>
            Continue to Shouks
          </h1>
          <p className="text-[14px] text-ink-soft mb-7">
            One account for joining marketplaces and running your own. New here? You'll be signed up automatically.
          </p>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 rounded-[10px] bg-danger-soft text-danger text-[13px] border border-danger/20">
              {error === "CredentialsSignin"
                ? "Email or password is incorrect."
                : "Something went wrong signing in. Try again."}
            </div>
          )}

          <form action={googleSignIn} data-testid="google-signin-form">
            <button
              type="submit"
              className="w-full h-11 rounded-[10px] border border-line bg-surface hover:bg-hover flex items-center justify-center gap-2.5 font-medium text-[14px] transition mb-2"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <button
            type="button"
            disabled
            title="Identity linking only — not a login method"
            className="w-full h-11 rounded-[10px] border border-line bg-surface hover:bg-hover flex items-center justify-center gap-2.5 font-medium text-[14px] transition mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FacebookIcon />
            Continue with Facebook
          </button>

          <button
            type="button"
            disabled
            title="Identity linking only — not a login method"
            className="w-full h-11 rounded-[10px] border border-line bg-surface hover:bg-hover flex items-center justify-center gap-2.5 font-medium text-[14px] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <InstagramIcon />
            Continue with Instagram
          </button>

          {credentialsEnabled && (
            <>
              <div className="my-5 flex items-center gap-3 text-[12px] text-muted">
                <div className="h-px bg-line-soft flex-1" />
                or email
                <div className="h-px bg-line-soft flex-1" />
              </div>

              <SignInForm callbackUrl={callbackUrl} />

              <p className="mt-6 text-center text-[13px] text-muted">
                New to Shouks?{" "}
                <Link href="/signup" className="text-blue-ink hover:underline font-medium">
                  Create an account
                </Link>
              </p>
            </>
          )}
        </div>
        <p className="text-center text-[12px] text-muted mt-5">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline hover:text-ink">Terms</Link>{" "}and{" "}
          <Link href="/privacy" className="underline hover:text-ink">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="5.5" fill="url(#ig-grad)" />
      <path fill="white" d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.92A3.12 3.12 0 1 1 12 8.88 3.12 3.12 0 0 1 12 15.12zM17.04 7.08a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0z" />
      <path fill="white" d="M16.2 2H7.8A5.8 5.8 0 0 0 2 7.8v8.4A5.8 5.8 0 0 0 7.8 22h8.4A5.8 5.8 0 0 0 22 16.2V7.8A5.8 5.8 0 0 0 16.2 2zm4.12 14.2a4.12 4.12 0 0 1-4.12 4.12H7.8a4.12 4.12 0 0 1-4.12-4.12V7.8A4.12 4.12 0 0 1 7.8 3.68h8.4A4.12 4.12 0 0 1 20.32 7.8v8.4z" />
    </svg>
  );
}

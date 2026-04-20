import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] grid place-items-center py-12 px-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-surface border border-line rounded-[14px] shadow p-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] mb-1.5">
            Create your <span className="serif italic text-blue">account</span>
          </h1>
          <p className="text-[14px] text-ink-soft mb-7">
            One account for every marketplace you join or run.
          </p>
          <SignUpForm />
          <p className="mt-6 text-center text-[13px] text-muted">
            Already have an account?{" "}
            <Link href="/signin" className="text-blue-ink hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Help } from "@/components/ui/Input";
import { i18n } from '@shipeasy/sdk/client'

export function SignUpForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error ?? i18n.t('...signup.signUpForm.couldNotCreateAccount'));
      setSubmitting(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);
    router.push("/onboarding/role");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-testid="signup-form">
      <div>
        <Label htmlFor="displayName" required>{i18n.t('common.displayName')}</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          minLength={2}
          maxLength={50}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={i18n.t('...signup.signUpForm.janeMerchantPlaceholder')}
        />
      </div>
      <div>
        <Label htmlFor="email" required>{i18n.t('common.email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={i18n.t('common.youexamplecom')}
        />
      </div>
      <div>
        <Label htmlFor="password" required>{i18n.t('common.password')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={i18n.t('...signup.signUpForm.atLeast8CharactersPlaceholder')}
        />
        <Help>{i18n.t('...signup.signUpForm.useAtLeast8Characters')}</Help>
      </div>
      {error && (
        <div className="text-[13px] text-danger" data-testid="signup-error">
          {error}
        </div>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? i18n.t('...signup.signUpForm.creatingAccount') : i18n.t('...signup.signUpForm.createAccount')}
      </Button>
    </form>
  );
}

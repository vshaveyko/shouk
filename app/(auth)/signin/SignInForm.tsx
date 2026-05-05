"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { i18n } from '@shipeasy/sdk/client'

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);
    if (result?.error) {
      setError("Email or password is incorrect.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-testid="credentials-form">
      <div>
        <Label htmlFor="email">{i18n.t('common.email')}</Label>
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
        <Label htmlFor="password">{i18n.t('common.password')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          placeholder="••••••••"
        />
      </div>
      {error && (
        <div className="text-[13px] text-danger" data-testid="signin-error">
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
        {submitting ? i18n.t('...signin.signInForm.signingIn') : i18n.t('common.signIn')}
      </Button>
    </form>
  );
}

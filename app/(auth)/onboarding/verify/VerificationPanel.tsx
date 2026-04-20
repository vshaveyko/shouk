"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type LinkedAccount = { provider: string; handle: string };

const providers = [
  { id: "GOOGLE", label: "Google", badge: "G", bg: "#4285f4" },
  { id: "FACEBOOK", label: "Facebook", badge: "f", bg: "#1877f2" },
  { id: "INSTAGRAM", label: "Instagram", badge: "IG", bg: "linear-gradient(135deg,#f58529,#dd2a7b,#515bd4)" },
  { id: "LINKEDIN", label: "LinkedIn", badge: "in", bg: "#0a66c2" },
  { id: "TWITTER", label: "X / Twitter", badge: "X", bg: "#000" },
];

export function VerificationPanel({
  initial,
  phone,
  nextHref,
}: {
  initial: LinkedAccount[];
  phone: { phoneNumber: string | null; phoneVerified: boolean } | null;
  nextHref: string;
}) {
  const router = useRouter();
  const [linked, setLinked] = useState<LinkedAccount[]>(initial);
  const [phoneNumber, setPhoneNumber] = useState(phone?.phoneNumber ?? "");
  const [phoneVerified, setPhoneVerified] = useState(phone?.phoneVerified ?? false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mockLink(providerId: string) {
    setBusy(providerId);
    setError(null);
    const res = await fetch("/api/user/verify/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: providerId, handle: generateMockHandle(providerId) }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error ?? "Could not link account.");
      return;
    }
    const body = await res.json();
    setLinked((s) => [...s.filter((x) => x.provider !== providerId), { provider: providerId, handle: body.handle }]);
  }

  async function unlink(providerId: string) {
    setBusy(providerId);
    await fetch("/api/user/verify/link", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: providerId }),
    });
    setLinked((s) => s.filter((x) => x.provider !== providerId));
    setBusy(null);
  }

  async function sendPhoneCode() {
    setBusy("PHONE");
    setError(null);
    const res = await fetch("/api/user/verify/phone/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    setBusy(null);
    if (!res.ok) {
      setError("Invalid phone number.");
      return;
    }
    setPhoneCodeSent(true);
  }

  async function confirmPhoneCode() {
    setBusy("PHONE");
    const res = await fetch("/api/user/verify/phone/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: phoneCode }),
    });
    setBusy(null);
    if (!res.ok) {
      setError("Invalid or expired code.");
      return;
    }
    setPhoneVerified(true);
    setPhoneCodeSent(false);
  }

  return (
    <div className="bg-surface border border-line rounded-[14px] shadow p-6 md:p-8 space-y-4">
      <div className="space-y-2.5" data-testid="verify-providers">
        {providers.map((p) => {
          const isLinked = linked.some((l) => l.provider === p.id);
          const linkedItem = linked.find((l) => l.provider === p.id);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 p-3 rounded-[10px] border border-line-soft bg-bg-panel"
              data-testid={`verify-row-${p.id.toLowerCase()}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-[8px] grid place-items-center text-white font-semibold text-[14px] flex-none"
                  style={{ background: p.bg }}
                >
                  {p.badge}
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-medium">{p.label}</div>
                  {isLinked ? (
                    <div className="text-[12px] text-success flex items-center gap-1.5">
                      <Check size={12} /> {linkedItem?.handle}
                    </div>
                  ) : (
                    <div className="text-[12px] text-muted">Not linked</div>
                  )}
                </div>
              </div>
              {isLinked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy === p.id}
                  onClick={() => unlink(p.id)}
                >
                  Unlink
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy === p.id}
                  onClick={() => mockLink(p.id)}
                  data-testid={`link-${p.id.toLowerCase()}`}
                >
                  <Link2 size={14} /> Link
                </Button>
              )}
            </div>
          );
        })}

        {/* Phone */}
        <div className="p-3 rounded-[10px] border border-line-soft bg-bg-panel" data-testid="verify-row-phone">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-[8px] grid place-items-center bg-[oklch(0.3_0.02_240)] text-white font-semibold text-[14px]">☎︎</span>
              <div className="min-w-0">
                <div className="text-[14px] font-medium">Phone (SMS)</div>
                {phoneVerified ? (
                  <div className="text-[12px] text-success flex items-center gap-1.5"><Check size={12} /> {phoneNumber}</div>
                ) : (
                  <div className="text-[12px] text-muted">Verify by SMS code</div>
                )}
              </div>
            </div>
          </div>
          {!phoneVerified && (
            <div className="grid grid-cols-[1fr_auto] gap-2 mt-1">
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-[36px] px-3 rounded-[8px] border border-line bg-surface text-[14px] focus:outline-none focus:border-blue focus:ring-[3px] focus:ring-[var(--blue-softer)]"
                data-testid="phone-input"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={busy === "PHONE" || !phoneNumber}
                onClick={sendPhoneCode}
                data-testid="phone-send-code"
              >
                {phoneCodeSent ? "Resend" : "Send code"}
              </Button>
              {phoneCodeSent && (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="h-[36px] px-3 rounded-[8px] border border-line bg-surface text-[14px] focus:outline-none focus:border-blue focus:ring-[3px] focus:ring-[var(--blue-softer)]"
                    data-testid="phone-code"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busy === "PHONE" || phoneCode.length !== 6}
                    onClick={confirmPhoneCode}
                    data-testid="phone-verify"
                  >
                    Verify
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-[13px] text-danger" data-testid="verify-error">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-line-soft">
        <Link href={nextHref} className="text-[13px] text-muted hover:text-ink" data-testid="verify-skip">
          Skip for now
        </Link>
        <Button
          variant="primary"
          onClick={() => router.push(nextHref)}
          data-testid="verify-continue"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function generateMockHandle(providerId: string) {
  const base = Math.random().toString(36).slice(2, 7);
  if (providerId === "INSTAGRAM") return `@jane_${base}`;
  if (providerId === "TWITTER") return `@jane_${base}`;
  if (providerId === "FACEBOOK") return `Jane Merchant`;
  if (providerId === "LINKEDIN") return `jane-merchant-${base}`;
  if (providerId === "GOOGLE") return `jane@example.com`;
  return base;
}

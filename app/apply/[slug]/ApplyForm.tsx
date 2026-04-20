"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Help } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export type ApplyQuestion = {
  id: string;
  label: string;
  helpText: string | null;
  type:
    | "SHORT_TEXT"
    | "LONG_TEXT"
    | "NUMBER"
    | "CURRENCY"
    | "SELECT"
    | "MULTI_SELECT"
    | "DATE"
    | "IMAGE";
  required: boolean;
  options: string[] | null;
};

type Props = {
  slug: string;
  marketplaceName: string;
  questions: ApplyQuestion[];
  prefill?: Record<string, unknown>;
};

type AnswerValue = string | number | string[] | null;

export function ApplyForm({ slug, marketplaceName, questions, prefill }: Props) {
  const router = useRouter();

  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>(
    () => {
      const seed: Record<string, AnswerValue> = {};
      for (const q of questions) {
        const raw = prefill?.[q.id];
        if (raw === undefined || raw === null) {
          seed[q.id] = q.type === "MULTI_SELECT" ? [] : "";
        } else if (q.type === "MULTI_SELECT") {
          seed[q.id] = Array.isArray(raw) ? (raw as string[]) : [];
        } else {
          seed[q.id] =
            typeof raw === "string" || typeof raw === "number"
              ? (raw as string | number)
              : String(raw);
        }
      }
      return seed;
    },
  );

  const [agree, setAgree] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [missingProviders, setMissingProviders] = React.useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (fieldErrors[id]) {
      setFieldErrors((fe) => {
        const next = { ...fe };
        delete next[id];
        return next;
      });
    }
  }

  function toggleMulti(id: string, option: string) {
    setAnswers((prev) => {
      const curr = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const next = curr.includes(option)
        ? curr.filter((o) => o !== option)
        : [...curr, option];
      return { ...prev, [id]: next };
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const q of questions) {
      if (!q.required) continue;
      const v = answers[q.id];
      if (
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0)
      ) {
        errs[q.id] = "This question is required.";
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMissingProviders([]);

    if (!agree) {
      setError("Please confirm the acknowledgement before submitting.");
      return;
    }
    if (!validate()) {
      setError("Please answer all required questions.");
      return;
    }

    // Clean up answers for submission: strip empty values, coerce numbers
    const payload: Record<string, string | number | string[]> = {};
    for (const q of questions) {
      const v = answers[q.id];
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) {
        if (v.length === 0) continue;
        payload[q.id] = v;
      } else if (q.type === "NUMBER" || q.type === "CURRENCY") {
        const num = Number(v);
        if (!Number.isNaN(num)) payload[q.id] = num;
      } else {
        payload[q.id] = v as string;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/marketplaces/${slug}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });

      if (res.ok) {
        router.push(`/m/${slug}`);
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        missing?: string[];
      };

      if (res.status === 409) {
        if (data.missing && data.missing.length > 0) {
          setMissingProviders(data.missing);
          setError(
            data.error ?? "You're missing required verifications for this marketplace.",
          );
        } else {
          setError(
            data.error ??
              "You already have a pending application for this marketplace.",
          );
        }
      } else if (res.status === 401) {
        setError("You need to sign in again.");
        router.push(`/signin?callbackUrl=/apply/${slug}`);
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      data-testid="apply-form"
      className="space-y-5"
      noValidate
    >
      <section className="bg-surface border border-line rounded-[14px] shadow-sm p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-[17px] font-semibold">Your answers</h2>
          <p className="text-[13px] text-muted mt-1">
            Honest, specific answers get approved faster.
          </p>
        </div>

        {questions.length === 0 ? (
          <p className="text-[13px] text-muted">
            No questions — just confirm and submit.
          </p>
        ) : (
          questions.map((q) => {
            const err = fieldErrors[q.id];
            return (
              <div
                key={q.id}
                data-testid={`apply-question-${q.id}`}
                className="space-y-0"
              >
                <Label htmlFor={`q-${q.id}`} required={q.required}>
                  {q.label}
                </Label>
                {renderField(q, answers[q.id], {
                  onChange: (v) => setAnswer(q.id, v),
                  onToggleMulti: (o) => toggleMulti(q.id, o),
                  invalid: !!err,
                })}
                {q.helpText && !err && <Help>{q.helpText}</Help>}
                {err && <Help error>{err}</Help>}
              </div>
            );
          })
        )}
      </section>

      {/* Acknowledgement */}
      <section className="bg-surface border border-line rounded-[14px] shadow-sm p-5 sm:p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-line accent-[var(--blue)]"
            data-testid="apply-agree"
          />
          <span className="text-[13px] text-ink-soft leading-[1.6]">
            I understand my application will be reviewed by the owners of{" "}
            <span className="font-medium text-ink">{marketplaceName}</span>. I
            can withdraw my application at any time from my Shouks account.
          </span>
        </label>
      </section>

      {/* Errors */}
      {error && (
        <div
          data-testid="apply-error"
          className="rounded-[12px] border border-danger/30 bg-danger-soft/40 p-4 flex items-start gap-3"
          role="alert"
        >
          <AlertCircle size={18} className="text-danger flex-none mt-0.5" />
          <div className="flex-1 space-y-2 text-[13px] text-ink">
            <p>{error}</p>
            {missingProviders.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {missingProviders.map((p) => (
                  <Link
                    key={p}
                    href={`/onboarding/verify?redirect=/apply/${slug}`}
                    data-testid={`verify-link-${p}`}
                    className="text-[12px] text-blue-ink hover:underline"
                  >
                    Link {p.toLowerCase()} →
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          disabled={submitting}
          data-testid="apply-submit"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Submitting…
            </>
          ) : (
            "Submit application"
          )}
        </Button>
        <Link href={`/m/${slug}`} className="sm:flex-none">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}

function renderField(
  q: ApplyQuestion,
  value: AnswerValue,
  handlers: {
    onChange: (v: AnswerValue) => void;
    onToggleMulti: (option: string) => void;
    invalid: boolean;
  },
) {
  const id = `q-${q.id}`;
  const invalidRing = handlers.invalid
    ? "border-danger focus-visible:border-danger focus-visible:ring-danger/20"
    : "";

  switch (q.type) {
    case "LONG_TEXT":
      return (
        <Textarea
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => handlers.onChange(e.target.value)}
          placeholder="Your answer…"
          className={cn("min-h-[120px]", invalidRing)}
        />
      );
    case "NUMBER":
    case "CURRENCY":
      return (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={(value as string | number | null) ?? ""}
          onChange={(e) => handlers.onChange(e.target.value)}
          placeholder="0"
          className={invalidRing}
        />
      );
    case "DATE":
      return (
        <Input
          id={id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => handlers.onChange(e.target.value)}
          className={invalidRing}
        />
      );
    case "SELECT": {
      const options = q.options ?? [];
      return (
        <Select
          value={(value as string) || undefined}
          onValueChange={(v) => handlers.onChange(v)}
        >
          <SelectTrigger id={id} className={invalidRing}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case "MULTI_SELECT": {
      const options = q.options ?? [];
      const current = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div
          className={cn(
            "flex flex-wrap gap-2",
            handlers.invalid && "ring-1 ring-danger/30 rounded-[10px] p-1",
          )}
          role="group"
        >
          {options.map((o) => {
            const active = current.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => handlers.onToggleMulti(o)}
                className={cn(
                  "px-3 h-8 rounded-full border text-[13px] transition",
                  active
                    ? "bg-blue text-white border-blue"
                    : "bg-surface text-ink-soft border-line hover:bg-hover hover:text-ink",
                )}
                aria-pressed={active}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    }
    case "SHORT_TEXT":
    default:
      return (
        <Input
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => handlers.onChange(e.target.value)}
          placeholder="Your answer…"
          className={invalidRing}
        />
      );
  }
}

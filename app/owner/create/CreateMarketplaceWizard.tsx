"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  Plus,
  Sparkles,
  Trash2,
  X,
  Rocket,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Label,
  Help,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { cn, categories, slugify, verifyProviders } from "@/lib/utils";

// ---------- Types ----------

type FieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "CURRENCY"
  | "SELECT"
  | "MULTI_SELECT"
  | "DATE"
  | "IMAGE";

type SchemaField = {
  uid: string;
  label: string;
  name: string;
  type: FieldType;
  required: boolean;
  helpText?: string;
  options?: string[];
  minImages?: number;
  maxImages?: number;
};

type QuestionFieldType = Exclude<FieldType, "IMAGE" | "CURRENCY">;

type ApplicationQuestion = {
  uid: string;
  label: string;
  type: QuestionFieldType;
  required: boolean;
  helpText?: string;
  options?: string[];
};

type EntryMethod = "APPLICATION" | "INVITE" | "REFERRAL";
type VerifyProviderId = (typeof verifyProviders)[number]["id"];

type FormState = {
  name: string;
  slug: string;
  slugTouched: boolean;
  tagline: string;
  description: string;
  category: string;
  primaryColor: string;
  schemaFields: SchemaField[];
  entryMethod: EntryMethod;
  requiredVerifications: VerifyProviderId[];
  autoApprove: boolean;
  applicationQuestions: ApplicationQuestion[];
  isPaid: boolean;
  monthlyPriceDollars: string;
  annualPriceDollars: string;
  auctionsEnabled: boolean;
  antiSnipe: boolean;
  moderationRequired: boolean;
};

type Errors = Partial<Record<string, string>>;

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "SHORT_TEXT", label: "Short text" },
  { value: "LONG_TEXT", label: "Long text" },
  { value: "NUMBER", label: "Number" },
  { value: "CURRENCY", label: "Currency" },
  { value: "SELECT", label: "Single select" },
  { value: "MULTI_SELECT", label: "Multi select" },
  { value: "DATE", label: "Date" },
  { value: "IMAGE", label: "Image" },
];

const QUESTION_TYPE_OPTIONS: { value: QuestionFieldType; label: string }[] = [
  { value: "SHORT_TEXT", label: "Short text" },
  { value: "LONG_TEXT", label: "Long text" },
  { value: "NUMBER", label: "Number" },
  { value: "SELECT", label: "Single select" },
  { value: "MULTI_SELECT", label: "Multi select" },
  { value: "DATE", label: "Date" },
];

const STEPS = [
  { n: 1, title: "Identity", hint: "Name, tagline, and branding" },
  { n: 2, title: "Listing schema", hint: "What can be sold?" },
  { n: 3, title: "Membership rules", hint: "Who can join?" },
  { n: 4, title: "Monetization", hint: "Pricing & moderation" },
] as const;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const toFieldName = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50) || "field";

const INITIAL_STATE: FormState = {
  name: "",
  slug: "",
  slugTouched: false,
  tagline: "",
  description: "",
  category: "",
  primaryColor: "#4DB7E8",
  schemaFields: [
    {
      uid: uid(),
      label: "Title",
      name: "title",
      type: "SHORT_TEXT",
      required: true,
      helpText: "A short, descriptive name for the listing.",
    },
    {
      uid: uid(),
      label: "Price",
      name: "price",
      type: "CURRENCY",
      required: true,
    },
    {
      uid: uid(),
      label: "Images",
      name: "images",
      type: "IMAGE",
      required: true,
      minImages: 1,
      maxImages: 10,
    },
  ],
  entryMethod: "APPLICATION",
  requiredVerifications: ["GOOGLE"],
  autoApprove: false,
  applicationQuestions: [
    {
      uid: uid(),
      label: "Why would you like to join?",
      type: "LONG_TEXT",
      required: true,
    },
  ],
  isPaid: false,
  monthlyPriceDollars: "",
  annualPriceDollars: "",
  auctionsEnabled: false,
  antiSnipe: true,
  moderationRequired: false,
};

// ---------- Component ----------

export function CreateMarketplaceWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [state, setState] = React.useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);

  // Auto-suggest slug from name until user edits it
  React.useEffect(() => {
    if (!state.slugTouched) {
      setState((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.name]);

  // --- Validation per step ---

  function validateStep(current: 1 | 2 | 3 | 4): Errors {
    const e: Errors = {};
    if (current === 1) {
      if (state.name.trim().length < 3) e.name = "Name must be at least 3 characters.";
      if (state.name.trim().length > 100) e.name = "Name must be 100 characters or fewer.";
      if (!state.slug) e.slug = "Slug is required.";
      else if (!/^[a-z0-9-]+$/.test(state.slug)) e.slug = "Use only lowercase letters, numbers, and hyphens.";
      else if (state.slug.length < 3) e.slug = "Slug must be at least 3 characters.";
      if (!state.category) e.category = "Pick a category.";
      if (state.description.length > 500) e.description = "Description must be 500 characters or fewer.";
      if (state.primaryColor && !/^#([0-9a-fA-F]{6})$/.test(state.primaryColor))
        e.primaryColor = "Use a 6-digit hex code, e.g. #4DB7E8.";
    }
    if (current === 2) {
      if (state.schemaFields.length < 1) e.schemaFields = "Add at least one field.";
      if (state.schemaFields.length > 25) e.schemaFields = "Maximum of 25 fields.";
      state.schemaFields.forEach((f, i) => {
        if (!f.label.trim()) e[`field-${i}-label`] = "Display name is required.";
        if ((f.type === "SELECT" || f.type === "MULTI_SELECT") && (!f.options || f.options.length < 1))
          e[`field-${i}-options`] = "Add at least one option.";
        if (f.type === "IMAGE") {
          const min = f.minImages ?? 0;
          const max = f.maxImages ?? 1;
          if (max < 1 || max > 20) e[`field-${i}-maxImages`] = "Max images between 1 and 20.";
          if (min < 0 || min > max) e[`field-${i}-minImages`] = "Min must be ≤ max.";
        }
      });
    }
    if (current === 3) {
      if (state.requiredVerifications.length < 1) e.requiredVerifications = "Select at least one verification.";
      if (state.entryMethod === "APPLICATION") {
        state.applicationQuestions.forEach((q, i) => {
          if (!q.label.trim()) e[`q-${i}-label`] = "Question is required.";
          if ((q.type === "SELECT" || q.type === "MULTI_SELECT") && (!q.options || q.options.length < 1))
            e[`q-${i}-options`] = "Add at least one option.";
        });
      }
    }
    if (current === 4) {
      if (state.isPaid) {
        const m = state.monthlyPriceDollars.trim();
        const a = state.annualPriceDollars.trim();
        if (!m && !a) e.pricing = "Enter a monthly or annual price.";
        if (m && !/^\d+(\.\d{1,2})?$/.test(m)) e.monthlyPrice = "Use a dollar amount, e.g. 9.99";
        if (a && !/^\d+(\.\d{1,2})?$/.test(a)) e.annualPrice = "Use a dollar amount, e.g. 99.00";
      }
    }
    return e;
  }

  function handleNext() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0 && step < 4) {
      setStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (step > 1) setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));
  }

  async function handlePublish() {
    // Validate every step before submit
    const all: Errors = {
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3),
      ...validateStep(4),
    };
    if (Object.keys(all).length > 0) {
      setErrors(all);
      // jump to earliest failing step
      if (
        Object.keys(all).some((k) =>
          ["name", "slug", "category", "description", "primaryColor"].includes(k),
        )
      )
        setStep(1);
      else if (Object.keys(all).some((k) => k.startsWith("field-") || k === "schemaFields")) setStep(2);
      else if (
        Object.keys(all).some(
          (k) => k === "requiredVerifications" || k.startsWith("q-"),
        )
      )
        setStep(3);
      else setStep(4);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const monthlyCents =
      state.isPaid && state.monthlyPriceDollars.trim()
        ? Math.round(parseFloat(state.monthlyPriceDollars) * 100)
        : null;
    const annualCents =
      state.isPaid && state.annualPriceDollars.trim()
        ? Math.round(parseFloat(state.annualPriceDollars) * 100)
        : null;

    const payload = {
      name: state.name.trim(),
      slug: state.slug,
      tagline: state.tagline.trim() || null,
      description: state.description.trim() || null,
      category: state.category,
      primaryColor: state.primaryColor || null,
      entryMethod: state.entryMethod,
      requiredVerifications: state.requiredVerifications,
      autoApprove: state.entryMethod === "REFERRAL" ? state.autoApprove : false,
      auctionsEnabled: state.auctionsEnabled,
      antiSnipe: state.antiSnipe,
      moderationRequired: state.moderationRequired,
      isPaid: state.isPaid,
      monthlyPriceCents: monthlyCents,
      annualPriceCents: annualCents,
      schemaFields: state.schemaFields.map((f) => ({
        name: f.name || toFieldName(f.label),
        label: f.label.trim(),
        helpText: f.helpText?.trim() || null,
        type: f.type,
        required: f.required,
        options:
          f.type === "SELECT" || f.type === "MULTI_SELECT"
            ? (f.options ?? []).filter((o) => o.trim())
            : null,
        minImages: f.type === "IMAGE" ? f.minImages ?? 0 : null,
        maxImages: f.type === "IMAGE" ? f.maxImages ?? 10 : null,
      })),
      applicationQuestions:
        state.entryMethod === "APPLICATION"
          ? state.applicationQuestions.map((q) => ({
              label: q.label.trim(),
              helpText: q.helpText?.trim() || null,
              type: q.type,
              required: q.required,
              options:
                q.type === "SELECT" || q.type === "MULTI_SELECT"
                  ? (q.options ?? []).filter((o) => o.trim())
                  : null,
            }))
          : [],
      publish: true,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/marketplaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error ?? "Couldn't create marketplace.");
        if (res.status === 409) {
          setErrors((prev) => ({ ...prev, slug: json.error }));
          setStep(1);
        }
        return;
      }
      toast.success("Marketplace published!");
      router.push(`/owner/${json.slug}/dashboard`);
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Render ---

  return (
    <main className="flex-1">
      <style dangerouslySetInnerHTML={{ __html: wizardCss }} />
      <div className="wiz-wrap">
        <aside className="wiz-steps">
          <div className="wiz-steps-label">Create a marketplace</div>
          <StepRail current={step} onJump={(n) => setStep(n)} />
        </aside>

        <form
          data-testid="create-mp-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 4) handlePublish();
            else handleNext();
          }}
          className="wiz-body"
        >
          <header className="wiz-head">
            <h1>
              {step === 1
                ? "Let's name your marketplace."
                : step === 2
                  ? "What gets listed here?"
                  : step === 3
                    ? "Who gets to join?"
                    : "Do members pay?"}
            </h1>
            <p className="sub">
              {step === 1
                ? "Start with the basics. Everything here except name & URL can be changed later."
                : step === 2
                  ? "Design the listing form your members will fill out. Types, required fields, help text."
                  : step === 3
                    ? "Public, application, or invite-only. You decide the bar for entry."
                    : "Free to join, or charge a membership. Turn on auctions if it fits your community."}
            </p>
          </header>
          {step === 1 && <IdentityStep state={state} setState={setState} errors={errors} />}
          {step === 2 && <SchemaStep state={state} setState={setState} errors={errors} />}
          {step === 3 && <MembershipStep state={state} setState={setState} errors={errors} />}
          {step === 4 && <MonetizationStep state={state} setState={setState} errors={errors} />}
        </form>

        <aside className="wiz-preview">
          <div className="preview-card">
            <div className="preview-label">Preview</div>
            <div
              className="preview-hero"
              style={{
                background: state.primaryColor
                  ? `linear-gradient(135deg, ${state.primaryColor}, color-mix(in oklab, ${state.primaryColor} 60%, black))`
                  : "linear-gradient(135deg, oklch(0.48 0.2 28), oklch(0.26 0.14 25))",
              }}
            />
            <div className="preview-body">
              <div className="preview-name">
                {state.name || "Marketplace name"}
              </div>
              <div className="preview-url">
                shouks.com/m/{state.slug || "your-slug"}
              </div>
              {state.tagline && (
                <div className="preview-tagline">{state.tagline}</div>
              )}
              <div className="preview-stats">
                <span>{state.schemaFields.length} listing fields</span>
                <span>·</span>
                <span>
                  {state.entryMethod === "APPLICATION"
                    ? "Application"
                    : state.entryMethod === "INVITE"
                      ? "Invite only"
                      : "Referral"}
                </span>
                <span>·</span>
                <span>{state.isPaid ? "Paid membership" : "Free"}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <StickyFooter
        step={step}
        submitting={submitting}
        onBack={handleBack}
        onNext={handleNext}
        onPublish={handlePublish}
      />
    </main>
  );
}

const wizardCss = `
.wiz-wrap { display: grid; grid-template-columns: 220px minmax(0, 1fr) 340px; max-width: 1280px; margin: 0 auto; min-height: calc(100vh - 64px); }
@media (max-width: 1100px) { .wiz-wrap { grid-template-columns: 1fr; } .wiz-wrap .wiz-steps { display: none; } .wiz-wrap .wiz-preview { display: none; } }
.wiz-steps { border-right: 1px solid var(--line); padding: 32px 18px; background: #fff; }
.wiz-steps-label { font-size: 10px; color: var(--muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 0 12px 12px; }
.wiz-body { padding: 40px 44px 120px; display: flex; flex-direction: column; min-width: 0; background: var(--bg-soft); }
.wiz-head { margin-bottom: 28px; }
.wiz-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 32px; letter-spacing: -0.01em; line-height: 1.1; margin-bottom: 8px; }
.wiz-head .sub { font-size: 13.5px; color: var(--muted); max-width: 560px; }

.wiz-steps ol.wiz-step-list { list-style: none; padding: 0; margin: 0; }
.wiz-step { display: flex; align-items: flex-start; gap: 12px; padding: 10px 12px; border-radius: 8px; position: relative; cursor: pointer; background: transparent; border: 0; width: 100%; text-align: left; font: inherit; color: inherit; }
.wiz-step + .wiz-step::before { content: ""; position: absolute; left: 24px; top: -6px; height: 6px; width: 1px; background: var(--line); }
.wiz-step .ball { width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 1.5px solid var(--line); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--muted); flex: none; position: relative; z-index: 2; }
.wiz-step > div:last-child { min-width: 0; }
.wiz-step .t { font-size: 13px; font-weight: 500; color: var(--ink-soft); margin-top: 3px; letter-spacing: -0.005em; line-height: 1.2; }
.wiz-step .s { font-size: 11.5px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }
.wiz-step.active { background: var(--bg-soft); }
.wiz-step.active .ball { background: var(--ink); border-color: var(--ink); color: #fff; }
.wiz-step.active .t { color: var(--ink); font-weight: 600; }
.wiz-step.done .ball { background: var(--blue); border-color: var(--blue); color: #fff; }
.wiz-step.done .ball svg { width: 12px; height: 12px; stroke-width: 3; }
.wiz-step.done .t { color: var(--ink); }
.wiz-step:hover:not(.active) { background: var(--bg-soft); }

.wiz-preview { border-left: 1px solid var(--line); padding: 32px 24px; background: #fff; }
.preview-card { background: var(--bg-soft); border: 1px solid var(--line-soft); border-radius: 12px; overflow: hidden; position: sticky; top: 96px; }
.preview-label { padding: 10px 14px; font-size: 10px; color: var(--muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid var(--line-soft); }
.preview-hero { height: 100px; }
.preview-body { padding: 14px; }
.preview-name { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 22px; line-height: 1.2; letter-spacing: -0.005em; }
.preview-url { font-family: ui-monospace, monospace; font-size: 11px; color: var(--muted); margin-top: 2px; }
.preview-tagline { font-size: 12.5px; color: var(--ink-soft); margin-top: 10px; }
.preview-stats { display: flex; gap: 6px; align-items: center; font-size: 11px; color: var(--muted); margin-top: 10px; flex-wrap: wrap; }
`;

// ---------- Step Rail ----------

function StepRail({
  current,
  onJump,
}: {
  current: 1 | 2 | 3 | 4;
  onJump: (n: 1 | 2 | 3 | 4) => void;
}) {
  return (
    <ol className="wiz-step-list">
      {STEPS.map((s) => {
        const isActive = current === s.n;
        const isDone = current > s.n;
        return (
          <li key={s.n}>
            <button
              type="button"
              onClick={() => onJump(s.n as 1 | 2 | 3 | 4)}
              className={cn(
                "wiz-step",
                isActive && "active",
                isDone && "done",
              )}
            >
              <span className="ball">
                {isDone ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  s.n
                )}
              </span>
              <div>
                <div className="t">{s.title}</div>
                <div className="s">{s.hint}</div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Step 1: Identity ----------

function IdentityStep({
  state,
  setState,
  errors,
}: {
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Errors;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity</CardTitle>
        <CardDescription>How members will recognize your marketplace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label htmlFor="mp-name" required>
            Marketplace name
          </Label>
          <Input
            id="mp-name"
            data-testid="field-name"
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
            placeholder="e.g. Riviera Watch Club"
            maxLength={100}
            aria-invalid={!!errors.name}
          />
          {errors.name ? (
            <Help error>{errors.name}</Help>
          ) : (
            <Help>3–100 characters. Shown on your public page.</Help>
          )}
        </div>

        <div>
          <Label htmlFor="mp-slug" required>
            URL slug
          </Label>
          <div className="flex items-stretch rounded-[10px] border border-line bg-surface overflow-hidden focus-within:border-blue focus-within:ring-[3px] focus-within:ring-[var(--blue-softer)]">
            <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-r border-line select-none">
              shouks.co/m/
            </span>
            <input
              id="mp-slug"
              data-testid="field-slug"
              value={state.slug}
              onChange={(e) =>
                setState((s) => ({ ...s, slug: e.target.value.toLowerCase(), slugTouched: true }))
              }
              placeholder="riviera-watch-club"
              className="flex-1 h-[38px] px-3 bg-transparent text-[14px] outline-none"
              aria-invalid={!!errors.slug}
            />
          </div>
          {errors.slug ? (
            <Help error>{errors.slug}</Help>
          ) : (
            <Help>Lowercase letters, numbers, and hyphens only.</Help>
          )}
        </div>

        <div>
          <Label htmlFor="mp-tagline">Tagline</Label>
          <Input
            id="mp-tagline"
            value={state.tagline}
            onChange={(e) => setState((s) => ({ ...s, tagline: e.target.value }))}
            placeholder="A one-liner that captures the vibe."
            maxLength={140}
          />
          <Help>Up to 140 characters.</Help>
        </div>

        <div>
          <Label htmlFor="mp-description">Description</Label>
          <Textarea
            id="mp-description"
            data-testid="field-description"
            value={state.description}
            onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
            placeholder="What's this community for? Who should join?"
            maxLength={500}
            rows={4}
            aria-invalid={!!errors.description}
          />
          {errors.description ? (
            <Help error>{errors.description}</Help>
          ) : (
            <Help>{state.description.length}/500 characters.</Help>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label required>Category</Label>
            <Select
              value={state.category || undefined}
              onValueChange={(v) => setState((s) => ({ ...s, category: v }))}
            >
              <SelectTrigger data-testid="field-category" aria-invalid={!!errors.category}>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <Help error>{errors.category}</Help>}
          </div>

          <div>
            <Label htmlFor="mp-color">Primary color</Label>
            <div className="flex items-center gap-2">
              <div
                className="h-[38px] w-[38px] rounded-[10px] border border-line shrink-0"
                style={{ backgroundColor: state.primaryColor }}
                aria-hidden
              />
              <Input
                id="mp-color"
                data-testid="field-primary-color"
                value={state.primaryColor}
                onChange={(e) => setState((s) => ({ ...s, primaryColor: e.target.value }))}
                placeholder="#4DB7E8"
                maxLength={7}
                aria-invalid={!!errors.primaryColor}
              />
              <input
                type="color"
                aria-label="Pick a color"
                value={
                  /^#([0-9a-fA-F]{6})$/.test(state.primaryColor) ? state.primaryColor : "#4DB7E8"
                }
                onChange={(e) => setState((s) => ({ ...s, primaryColor: e.target.value }))}
                className="h-[38px] w-[38px] rounded-[10px] border border-line cursor-pointer bg-surface"
              />
            </div>
            {errors.primaryColor ? (
              <Help error>{errors.primaryColor}</Help>
            ) : (
              <Help>Used for accents on your marketplace pages.</Help>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Step 2: Schema Builder ----------

function SchemaStep({
  state,
  setState,
  errors,
}: {
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Errors;
}) {
  const fields = state.schemaFields;

  function updateField(idx: number, patch: Partial<SchemaField>) {
    setState((s) => ({
      ...s,
      schemaFields: s.schemaFields.map((f, i) => {
        if (i !== idx) return f;
        const next = { ...f, ...patch } as SchemaField;
        if (patch.label !== undefined) next.name = toFieldName(patch.label || f.label);
        // Reset type-specific bits when type changes
        if (patch.type && patch.type !== f.type) {
          if (patch.type === "SELECT" || patch.type === "MULTI_SELECT") {
            next.options = f.options ?? [""];
          } else {
            next.options = undefined;
          }
          if (patch.type === "IMAGE") {
            next.minImages = f.minImages ?? 1;
            next.maxImages = f.maxImages ?? 10;
          } else {
            next.minImages = undefined;
            next.maxImages = undefined;
          }
        }
        return next;
      }),
    }));
  }

  function move(idx: number, dir: -1 | 1) {
    setState((s) => {
      const next = [...s.schemaFields];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return s;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...s, schemaFields: next };
    });
  }

  function remove(idx: number) {
    setState((s) => ({
      ...s,
      schemaFields: s.schemaFields.filter((_, i) => i !== idx),
    }));
  }

  function addField() {
    if (fields.length >= 25) return;
    setState((s) => {
      const n = s.schemaFields.length + 1;
      return {
        ...s,
        schemaFields: [
          ...s.schemaFields,
          {
            uid: uid(),
            label: `Field ${n}`,
            name: `field_${n}`,
            type: "SHORT_TEXT",
            required: false,
          },
        ],
      };
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Listing schema</CardTitle>
            <CardDescription>
              Define what every listing in this marketplace looks like. We've pre-filled three
              essentials — tweak or add up to 25.
            </CardDescription>
          </div>
          <Badge>
            {fields.length}/25 fields
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {errors.schemaFields && <Help error className="mb-3">{errors.schemaFields}</Help>}
        <div className="space-y-3">
          {fields.map((f, i) => (
            <FieldRow
              key={f.uid}
              field={f}
              index={i}
              total={fields.length}
              onChange={(patch) => updateField(i, patch)}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onRemove={() => remove(i)}
              errors={errors}
            />
          ))}
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            data-testid="add-schema-field"
            onClick={addField}
            disabled={fields.length >= 25}
            className="gap-1.5"
          >
            <Plus size={16} /> Add field
          </Button>
          {fields.length >= 25 && (
            <Help className="mt-1">You've reached the 25-field maximum.</Help>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FieldRow({
  field,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  errors,
}: {
  field: SchemaField;
  index: number;
  total: number;
  onChange: (p: Partial<SchemaField>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  errors: Errors;
}) {
  return (
    <div
      data-testid="schema-field-row"
      className="rounded-[10px] border border-line bg-surface p-4 hover:border-line-soft transition"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 shrink-0 mt-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Move up"
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label="Move down"
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowDown size={14} />
          </button>
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`f-${field.uid}-label`} required>
              Display name
            </Label>
            <Input
              id={`f-${field.uid}-label`}
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="e.g. Condition"
              maxLength={80}
              aria-invalid={!!errors[`field-${index}-label`]}
            />
            {errors[`field-${index}-label`] && (
              <Help error>{errors[`field-${index}-label`]}</Help>
            )}
          </div>

          <div>
            <Label>Field type</Label>
            <Select
              value={field.type}
              onValueChange={(v) => onChange({ type: v as FieldType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor={`f-${field.uid}-help`}>Help text</Label>
            <Input
              id={`f-${field.uid}-help`}
              value={field.helpText ?? ""}
              onChange={(e) => onChange({ helpText: e.target.value })}
              placeholder="Shown under the field when sellers fill it out."
              maxLength={200}
            />
          </div>

          {(field.type === "SELECT" || field.type === "MULTI_SELECT") && (
            <div className="md:col-span-2">
              <Label required>Options</Label>
              <OptionsEditor
                options={field.options ?? []}
                onChange={(opts) => onChange({ options: opts })}
              />
              {errors[`field-${index}-options`] && (
                <Help error>{errors[`field-${index}-options`]}</Help>
              )}
            </div>
          )}

          {field.type === "IMAGE" && (
            <>
              <div>
                <Label htmlFor={`f-${field.uid}-min`}>Min images</Label>
                <Input
                  id={`f-${field.uid}-min`}
                  type="number"
                  min={0}
                  max={20}
                  value={field.minImages ?? 0}
                  onChange={(e) => onChange({ minImages: Number(e.target.value) })}
                  aria-invalid={!!errors[`field-${index}-minImages`]}
                />
                {errors[`field-${index}-minImages`] && (
                  <Help error>{errors[`field-${index}-minImages`]}</Help>
                )}
              </div>
              <div>
                <Label htmlFor={`f-${field.uid}-max`}>Max images</Label>
                <Input
                  id={`f-${field.uid}-max`}
                  type="number"
                  min={1}
                  max={20}
                  value={field.maxImages ?? 10}
                  onChange={(e) => onChange({ maxImages: Number(e.target.value) })}
                  aria-invalid={!!errors[`field-${index}-maxImages`]}
                />
                {errors[`field-${index}-maxImages`] && (
                  <Help error>{errors[`field-${index}-maxImages`]}</Help>
                )}
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove field"
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
          <label className="inline-flex items-center gap-2 text-[12px] text-ink-soft">
            <Switch
              checked={field.required}
              onCheckedChange={(v) => onChange({ required: !!v })}
              aria-label="Required field"
            />
            Required
          </label>
        </div>
      </div>
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  function update(i: number, v: string) {
    const next = [...options];
    next[i] = v;
    onChange(next);
  }
  function remove(i: number) {
    onChange(options.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...options, ""]);
  }
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={opt}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove option"
            className="h-[38px] w-[38px] grid place-items-center rounded-[10px] border border-line text-ink-soft hover:bg-hover hover:text-danger shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={add}>
        <Plus size={14} /> Add option
      </Button>
    </div>
  );
}

// ---------- Step 3: Membership ----------

function MembershipStep({
  state,
  setState,
  errors,
}: {
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Errors;
}) {
  function toggleVerify(id: VerifyProviderId) {
    setState((s) => {
      const has = s.requiredVerifications.includes(id);
      return {
        ...s,
        requiredVerifications: has
          ? s.requiredVerifications.filter((x) => x !== id)
          : [...s.requiredVerifications, id],
      };
    });
  }

  const entryOptions: {
    id: EntryMethod;
    title: string;
    body: string;
    testid: string;
  }[] = [
    {
      id: "APPLICATION",
      title: "Application",
      body: "People apply with a short form. You review and approve.",
      testid: "entry-method-application",
    },
    {
      id: "INVITE",
      title: "Invite link or code",
      body: "Share a link or code. Holders can join instantly.",
      testid: "entry-method-invite",
    },
    {
      id: "REFERRAL",
      title: "Referral",
      body: "Existing members vouch for newcomers.",
      testid: "entry-method-referral",
    },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>How do people join?</CardTitle>
          <CardDescription>Pick a single entry method.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="radiogroup" aria-label="Entry method">
            {entryOptions.map((opt) => {
              const selected = state.entryMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-testid={opt.testid}
                  onClick={() => setState((s) => ({ ...s, entryMethod: opt.id }))}
                  className={cn(
                    "text-left rounded-[10px] border p-4 transition",
                    selected
                      ? "border-blue bg-blue-soft ring-[3px] ring-[var(--blue-softer)]"
                      : "border-line bg-surface hover:bg-hover",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-semibold">{opt.title}</span>
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full border-2",
                        selected ? "border-blue bg-blue" : "border-line",
                      )}
                      aria-hidden
                    >
                      {selected && (
                        <span className="block h-full w-full rounded-full bg-white scale-50" />
                      )}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-muted">{opt.body}</p>
                </button>
              );
            })}
          </div>

          {state.entryMethod === "REFERRAL" && (
            <label className="mt-4 flex items-center gap-3 rounded-[10px] border border-line-soft bg-bg-panel px-3 py-2.5">
              <Switch
                checked={state.autoApprove}
                onCheckedChange={(v) => setState((s) => ({ ...s, autoApprove: !!v }))}
              />
              <span className="text-[13px]">
                <span className="font-medium">Auto-approve referrals</span>
                <span className="block text-muted text-[12px]">
                  Skip manual review once a vouch is received.
                </span>
              </span>
            </label>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required verifications</CardTitle>
          <CardDescription>
            Pick at least one — new members must link every account below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {verifyProviders.map((p) => {
              const checked = state.requiredVerifications.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 cursor-pointer transition",
                    checked
                      ? "border-blue bg-blue-soft"
                      : "border-line bg-surface hover:bg-hover",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    data-testid={`verify-option-${p.id.toLowerCase()}`}
                    onChange={() => toggleVerify(p.id)}
                    className="h-4 w-4 rounded border-line text-blue focus:ring-blue"
                  />
                  <span className="text-[13.5px] font-medium">{p.label}</span>
                </label>
              );
            })}
          </div>
          {errors.requiredVerifications && (
            <Help error className="mt-2">
              {errors.requiredVerifications}
            </Help>
          )}
        </CardContent>
      </Card>

      {state.entryMethod === "APPLICATION" && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Application questions</CardTitle>
                <CardDescription>
                  What do applicants need to answer? Leave empty for a frictionless apply.
                </CardDescription>
              </div>
              <Badge>{state.applicationQuestions.length} question{state.applicationQuestions.length === 1 ? "" : "s"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.applicationQuestions.map((q, i) => (
                <QuestionRow
                  key={q.uid}
                  question={q}
                  index={i}
                  errors={errors}
                  onChange={(patch) =>
                    setState((s) => ({
                      ...s,
                      applicationQuestions: s.applicationQuestions.map((x, idx) =>
                        idx === i ? { ...x, ...patch } : x,
                      ),
                    }))
                  }
                  onRemove={() =>
                    setState((s) => ({
                      ...s,
                      applicationQuestions: s.applicationQuestions.filter((_, idx) => idx !== i),
                    }))
                  }
                />
              ))}
              {state.applicationQuestions.length === 0 && (
                <p className="text-[13px] text-muted">No questions yet.</p>
              )}
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                data-testid="add-app-question"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    applicationQuestions: [
                      ...s.applicationQuestions,
                      {
                        uid: uid(),
                        label: "",
                        type: "SHORT_TEXT",
                        required: true,
                      },
                    ],
                  }))
                }
                className="gap-1.5"
              >
                <Plus size={16} /> Add question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuestionRow({
  question,
  index,
  errors,
  onChange,
  onRemove,
}: {
  question: ApplicationQuestion;
  index: number;
  errors: Errors;
  onChange: (p: Partial<ApplicationQuestion>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-surface p-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-start">
        <div>
          <Label htmlFor={`q-${question.uid}-label`} required>
            Question
          </Label>
          <Input
            id={`q-${question.uid}-label`}
            value={question.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. What brands do you collect?"
            maxLength={200}
            aria-invalid={!!errors[`q-${index}-label`]}
          />
          {errors[`q-${index}-label`] && <Help error>{errors[`q-${index}-label`]}</Help>}
        </div>

        <div>
          <Label>Answer type</Label>
          <Select
            value={question.type}
            onValueChange={(v) => {
              const next: Partial<ApplicationQuestion> = { type: v as QuestionFieldType };
              if (v === "SELECT" || v === "MULTI_SELECT") next.options = question.options ?? [""];
              else next.options = undefined;
              onChange(next);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove question"
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
          <label className="inline-flex items-center gap-2 text-[12px] text-ink-soft">
            <Switch
              checked={question.required}
              onCheckedChange={(v) => onChange({ required: !!v })}
              aria-label="Required question"
            />
            Required
          </label>
        </div>

        {(question.type === "SELECT" || question.type === "MULTI_SELECT") && (
          <div className="md:col-span-3">
            <Label required>Options</Label>
            <OptionsEditor
              options={question.options ?? []}
              onChange={(opts) => onChange({ options: opts })}
            />
            {errors[`q-${index}-options`] && <Help error>{errors[`q-${index}-options`]}</Help>}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Step 4: Monetization ----------

function MonetizationStep({
  state,
  setState,
  errors,
}: {
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Errors;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Membership pricing</CardTitle>
          <CardDescription>Free or subscription-based.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" aria-label="Pricing">
            <PricingOption
              testid="pricing-free"
              active={!state.isPaid}
              title="Free"
              body="Anyone approved can join at no cost."
              onClick={() => setState((s) => ({ ...s, isPaid: false }))}
            />
            <PricingOption
              testid="pricing-paid"
              active={state.isPaid}
              title="Paid membership"
              body="Charge monthly, annually, or both."
              onClick={() => setState((s) => ({ ...s, isPaid: true }))}
            />
          </div>

          {state.isPaid && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-[10px] border border-line-soft bg-bg-panel p-4">
              <div>
                <Label htmlFor="price-monthly">Monthly price (USD)</Label>
                <div className="flex items-stretch rounded-[10px] border border-line bg-surface overflow-hidden focus-within:border-blue focus-within:ring-[3px] focus-within:ring-[var(--blue-softer)]">
                  <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-r border-line select-none">
                    $
                  </span>
                  <input
                    id="price-monthly"
                    inputMode="decimal"
                    placeholder="9.99"
                    value={state.monthlyPriceDollars}
                    onChange={(e) =>
                      setState((s) => ({ ...s, monthlyPriceDollars: e.target.value }))
                    }
                    className="flex-1 h-[38px] px-3 bg-transparent text-[14px] outline-none"
                  />
                  <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-l border-line select-none">
                    /mo
                  </span>
                </div>
                {errors.monthlyPrice && <Help error>{errors.monthlyPrice}</Help>}
              </div>
              <div>
                <Label htmlFor="price-annual">Annual price (USD)</Label>
                <div className="flex items-stretch rounded-[10px] border border-line bg-surface overflow-hidden focus-within:border-blue focus-within:ring-[3px] focus-within:ring-[var(--blue-softer)]">
                  <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-r border-line select-none">
                    $
                  </span>
                  <input
                    id="price-annual"
                    inputMode="decimal"
                    placeholder="99.00"
                    value={state.annualPriceDollars}
                    onChange={(e) =>
                      setState((s) => ({ ...s, annualPriceDollars: e.target.value }))
                    }
                    className="flex-1 h-[38px] px-3 bg-transparent text-[14px] outline-none"
                  />
                  <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-l border-line select-none">
                    /yr
                  </span>
                </div>
                {errors.annualPrice && <Help error>{errors.annualPrice}</Help>}
              </div>
              {errors.pricing && (
                <div className="md:col-span-2">
                  <Help error>{errors.pricing}</Help>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules & behavior</CardTitle>
          <CardDescription>Tune moderation for new listings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <ToggleRow
              testid="moderation-toggle"
              title="Require moderation for new listings"
              body="Every new listing waits for approval before going live."
              checked={state.moderationRequired}
              onChange={(v) => setState((s) => ({ ...s, moderationRequired: v }))}
            />
            {/* Auctions and anti-snipe are hidden for V1 (SHK-027). Retained
                in state so migrations stay intact. */}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-[10px] border border-blue/20 bg-blue-soft px-4 py-3 flex items-start gap-3">
        <Sparkles size={18} className="text-blue-ink shrink-0 mt-0.5" />
        <div className="text-[13px] text-ink-soft">
          <span className="font-medium text-ink">Ready to launch?</span> Hit Publish and we'll spin up
          your marketplace immediately. You can tweak any of this later from Settings.
        </div>
      </div>
    </div>
  );
}

function PricingOption({
  active,
  title,
  body,
  onClick,
  testid,
}: {
  active: boolean;
  title: string;
  body: string;
  onClick: () => void;
  testid: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      data-testid={testid}
      onClick={onClick}
      className={cn(
        "text-left rounded-[10px] border p-4 transition",
        active
          ? "border-blue bg-blue-soft ring-[3px] ring-[var(--blue-softer)]"
          : "border-line bg-surface hover:bg-hover",
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[14px] font-semibold">{title}</span>
        <span
          className={cn(
            "h-4 w-4 rounded-full border-2",
            active ? "border-blue bg-blue" : "border-line",
          )}
          aria-hidden
        >
          {active && <span className="block h-full w-full rounded-full bg-white scale-50" />}
        </span>
      </div>
      <p className="text-[12.5px] text-muted">{body}</p>
    </button>
  );
}

function ToggleRow({
  title,
  body,
  checked,
  onChange,
  testid,
  disabled,
  disabledHint,
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testid: string;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-[10px] border border-line-soft bg-bg-panel px-4 py-3",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0">
        <div className="text-[14px] font-medium">{title}</div>
        <div className="text-[12.5px] text-muted">{disabled && disabledHint ? disabledHint : body}</div>
      </div>
      <Switch
        data-testid={testid}
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
        disabled={disabled}
        aria-label={title}
      />
    </div>
  );
}

// ---------- Sticky Footer ----------

function StickyFooter({
  step,
  submitting,
  onBack,
  onNext,
  onPublish,
}: {
  step: 1 | 2 | 3 | 4;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-3">
        <div className="text-[12.5px] text-muted hidden sm:block">
          Step {step} of {STEPS.length} — {STEPS[step - 1].title}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            data-testid="wizard-back"
            onClick={onBack}
            disabled={step === 1 || submitting}
            className="gap-1"
          >
            <ArrowLeft size={16} /> Back
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              variant="primary"
              data-testid="wizard-next"
              onClick={onNext}
              disabled={submitting}
              className="gap-1"
            >
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              data-testid="wizard-publish"
              onClick={onPublish}
              disabled={submitting}
              className="gap-1.5"
            >
              <Rocket size={16} />
              {submitting ? "Publishing…" : "Publish marketplace"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

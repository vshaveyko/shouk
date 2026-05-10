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
import { i18n } from '@shipeasy/sdk/client'

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

type EntryMethod = "APPLICATION" | "INVITE" | "REFERRAL" | "PUBLIC";
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
  unlisted: boolean;
  requiredVerifications: VerifyProviderId[];
  autoApprove: boolean;
  // SHK-065: when false (and entryMethod=APPLICATION), the wizard hides
  // the application-questions card and submits an empty list — owner
  // still gets a Request to join entry but doesn't ask anything.
  requiresApplication: boolean;
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
  { value: "SHORT_TEXT", label: i18n.t('common.shortText') },
  { value: "LONG_TEXT", label: i18n.t('common.longText') },
  { value: "NUMBER", label: i18n.t('common.number') },
  { value: "CURRENCY", label: i18n.t('common.currency') },
  { value: "SELECT", label: i18n.t('common.singleSelect') },
  { value: "MULTI_SELECT", label: i18n.t('common.multiSelect') },
  { value: "DATE", label: i18n.t('common.date') },
  { value: "IMAGE", label: i18n.t('common.image') },
];

const QUESTION_TYPE_OPTIONS: { value: QuestionFieldType; label: string }[] = [
  { value: "SHORT_TEXT", label: i18n.t('common.shortText') },
  { value: "LONG_TEXT", label: i18n.t('common.longText') },
  { value: "NUMBER", label: i18n.t('common.number') },
  { value: "SELECT", label: i18n.t('common.singleSelect') },
  { value: "MULTI_SELECT", label: i18n.t('common.multiSelect') },
  { value: "DATE", label: i18n.t('common.date') },
];

const STEPS = [
  { n: 1, title: i18n.t('common.identity'), hint: i18n.t('...create.createMarketplaceWizard.nameTaglineAndBrandingHint') },
  { n: 2, title: i18n.t('common.listingSchema'), hint: i18n.t('...create.createMarketplaceWizard.whatCanBeSoldHint') },
  { n: 3, title: i18n.t('common.membershipRules'), hint: i18n.t('...create.createMarketplaceWizard.whoCanJoinHint') },
  { n: 4, title: i18n.t('...create.createMarketplaceWizard.monetization'), hint: i18n.t('...create.createMarketplaceWizard.pricingModerationHint') },
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
      label: i18n.t('common.title'),
      name: "title",
      type: "SHORT_TEXT",
      required: true,
      helpText: "A short, descriptive name for the listing.",
    },
    {
      uid: uid(),
      label: i18n.t('common.price'),
      name: "price",
      type: "CURRENCY",
      required: true,
    },
    {
      uid: uid(),
      label: i18n.t('...create.createMarketplaceWizard.images'),
      name: "images",
      type: "IMAGE",
      required: true,
      minImages: 1,
      maxImages: 10,
    },
  ],
  entryMethod: "APPLICATION",
  unlisted: false,
  requiredVerifications: ["GOOGLE"],
  autoApprove: false,
  requiresApplication: true,
  applicationQuestions: [
    {
      uid: uid(),
      label: i18n.t('...create.createMarketplaceWizard.whyWouldYouLikeTo'),
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
      if (state.entryMethod === "APPLICATION" && state.requiresApplication) {
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
      else if (Object.keys(all).some((k) => k.startsWith(i18n.t('...create.createMarketplaceWizard.fieldStartsWith')) || k === "schemaFields")) setStep(2);
      else if (
        Object.keys(all).some(
          (k) => k === "requiredVerifications" || k.startsWith("q-"),
        )
      )
        setStep(3);
      else setStep(4);
      toast.error(i18n.t('...create.createMarketplaceWizard.pleaseFixTheHighlightedFields'));
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
      unlisted: state.unlisted,
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
        state.entryMethod === "APPLICATION" && state.requiresApplication
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
        toast.error(json?.error ?? i18n.t('...create.createMarketplaceWizard.couldntCreateMarketplace'));
        if (res.status === 409) {
          setErrors((prev) => ({ ...prev, slug: json.error }));
          setStep(1);
        }
        return;
      }
      toast.success(i18n.t('...create.createMarketplaceWizard.marketplacePublished'));
      router.push(`/owner/${json.slug}/dashboard`);
    } catch (err) {
      console.error(err);
      toast.error(i18n.t('common.networkErrorPleaseTryAgain'));
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
          <div className="wiz-steps-label">{i18n.t('common.createAMarketplace')}</div>
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
                ? i18n.t('...create.createMarketplaceWizard.letsNameYourMarketplace')
                : step === 2
                  ? i18n.t('...create.createMarketplaceWizard.whatGetsListedHere')
                  : step === 3
                    ? i18n.t('...create.createMarketplaceWizard.whoGetsToJoin')
                    : i18n.t('...create.createMarketplaceWizard.doMembersPay')}
            </h1>
            <p className="sub">
              {step === 1
                ? i18n.t('...create.createMarketplaceWizard.startWithTheBasicsEverything')
                : step === 2
                  ? i18n.t('...create.createMarketplaceWizard.designTheListingFormYour')
                  : step === 3
                    ? i18n.t('...create.createMarketplaceWizard.publicApplicationOrInviteonlyYou')
                    : i18n.t('...create.createMarketplaceWizard.freeToJoinOrCharge')}
            </p>
          </header>
          {step === 1 && <IdentityStep state={state} setState={setState} errors={errors} />}
          {step === 2 && <SchemaStep state={state} setState={setState} errors={errors} />}
          {step === 3 && <MembershipStep state={state} setState={setState} errors={errors} />}
          {step === 4 && <MonetizationStep state={state} setState={setState} errors={errors} />}
        </form>

        <aside className="wiz-preview">
          {step === 2 ? (
            <>
              <SchemaPreview fields={state.schemaFields} marketplaceName={state.name} />
              <SchemaListingCardPreview
                fields={state.schemaFields}
                marketplaceName={state.name}
                primaryColor={state.primaryColor || "#4DB7E8"}
              />
            </>
          ) : (
            <div className="preview-card">
              <div className="preview-label">{i18n.t('...create.createMarketplaceWizard.preview')}</div>
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
                  {state.name || i18n.t('common.marketplaceName')}
                </div>
                <div className="preview-url">
                  {i18n.t('common.shoukscomm')}{state.slug || "your-slug"}
                </div>
                {state.tagline && (
                  <div className="preview-tagline">{state.tagline}</div>
                )}
                <div className="preview-stats">
                  <span>{state.schemaFields.length} {i18n.t('...create.createMarketplaceWizard.listingFields')}</span>
                  <span>·</span>
                  <span>
                    {state.entryMethod === "PUBLIC"
                      ? i18n.t('common.open')
                      : state.entryMethod === "APPLICATION"
                        ? i18n.t('common.application')
                        : state.entryMethod === "INVITE"
                          ? i18n.t('common.inviteOnly')
                          : i18n.t('common.referral')}
                  </span>
                  <span>·</span>
                  <span>{state.isPaid ? i18n.t('common.paidMembership') : i18n.t('common.free')}</span>
                </div>
              </div>
            </div>
          )}
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

.section-label { font-size: 10px; color: var(--muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; margin-top: 0; }
.radio-card { width: 100%; display: flex; align-items: flex-start; gap: 12px; padding: 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); cursor: pointer; text-align: left; transition: border-color 120ms, background 120ms; font: inherit; }
.radio-card:hover { background: var(--hover); }
.radio-card.on { border-color: var(--blue); background: var(--blue-soft); box-shadow: 0 0 0 3px var(--blue-softer); }
.radio-card .rc-ball { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--line); flex: none; margin-top: 2px; position: relative; display: grid; place-items: center; }
.radio-card.on .rc-ball { border-color: var(--blue); background: var(--blue); }
.radio-card.on .rc-ball::after { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #fff; }
.radio-card .rc-t { font-size: 13.5px; font-weight: 600; letter-spacing: -0.005em; color: var(--ink); }
.radio-card .rc-s { font-size: 12px; color: var(--muted); margin-top: 3px; line-height: 1.5; }
.radio-card .rc-tag { margin-left: auto; flex: none; font-size: 9.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 7px; border-radius: 5px; background: var(--bg-soft); border: 1px solid var(--line-soft); color: var(--muted); align-self: flex-start; }
.radio-card.on .rc-tag { background: var(--blue-softer); border-color: var(--blue-soft); color: var(--blue-ink); }

.pv-label { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: var(--muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; }
.pv-frame { background: var(--bg-soft); border: 1px solid var(--line); border-radius: 14px; padding: 14px; box-shadow: var(--shadow); }
.pv-card { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 12px; }
.pv-title { font-size: 12px; font-weight: 600; margin-bottom: 10px; letter-spacing: -0.005em; }
.pv-field { margin-bottom: 10px; }
.pv-field .fl { font-size: 10.5px; color: var(--muted); font-weight: 500; margin-bottom: 4px; display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.pv-field .fl .req { color: var(--blue-ink); }
.pv-field .fl .tip { color: var(--muted); font-weight: 400; font-size: 10px; margin-left: 6px; }
.pv-field .fake-input { height: 24px; background: var(--bg-soft); border-radius: 5px; border: 1px solid var(--line-soft); }
.pv-field .fake-ta { height: 44px; background: var(--bg-soft); border-radius: 5px; border: 1px solid var(--line-soft); }
.pv-field .fake-num { height: 24px; width: 96px; background: var(--bg-soft); border-radius: 5px; border: 1px solid var(--line-soft); }
.pv-field .fake-upload { height: 48px; background: var(--bg-soft); border-radius: 5px; border: 1px dashed var(--line); display: grid; place-items: center; color: var(--muted); font-size: 10px; }
.pv-field .fake-opts { display: flex; flex-wrap: wrap; gap: 4px; }
.pv-field .fake-opt { font-size: 10.5px; padding: 2px 8px; border-radius: 999px; background: #fff; border: 1px solid var(--line); color: var(--muted); }
.pv-field .fake-switch { display: inline-flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--muted); }
.pv-field .fake-switch::before { content: ""; width: 22px; height: 12px; border-radius: 7px; background: var(--line); display: inline-block; }
`;

// ---------- Schema Preview ----------

function fakeMockFor(type: FieldType, options?: string[]) {
  switch (type) {
    case "LONG_TEXT": return <div className="fake-ta" />;
    case "NUMBER": return <div className="fake-num" />;
    case "CURRENCY": return <div className="fake-num" />;
    case "DATE": return <div className="fake-num" />;
    case "IMAGE": return <div className="fake-upload">{i18n.t('...create.createMarketplaceWizard.upload')}</div>;
    case "SELECT":
    case "MULTI_SELECT": {
      const opts = (options ?? []).filter((o) => o.trim()).slice(0, 4);
      return (
        <div className="fake-opts">
          {opts.map((o) => <span key={o} className="fake-opt">{o}</span>)}
          {(options ?? []).length > 4 && <span className="fake-opt">+{(options ?? []).length - 4} more</span>}
        </div>
      );
    }
    default: return <div className="fake-input" />;
  }
}

// SHK-054: complementary preview that shows what a generated listing card
// looks like — title, price, image placeholder, schema-value chips. Sits
// below the seller's create-form preview so admins can see both at once.
function SchemaListingCardPreview({ fields, marketplaceName, primaryColor }: { fields: SchemaField[]; marketplaceName: string; primaryColor: string }) {
  const sampleFor = (f: SchemaField): string => {
    if (f.options && f.options.length > 0) return f.options[0];
    switch (f.type) {
      case "NUMBER":
      case "CURRENCY":
        return "—";
      case "DATE":
        return new Date().toLocaleDateString();
      default:
        return "Sample";
    }
  };
  const chipFields = fields.filter((f) => f.type !== "IMAGE" && f.name !== "title" && f.name !== "price").slice(0, 4);
  return (
    <>
      <div className="pv-label" style={{ marginTop: 14 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        {i18n.t('...create.createMarketplaceWizard.generatedListingCard')}
      </div>
      <div className="pv-frame">
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 10,
            overflow: "hidden",
            fontSize: 11.5,
          }}
        >
          <div
            style={{
              height: 84,
              background: `linear-gradient(135deg, ${primaryColor || "var(--blue)"} , color-mix(in oklab, ${primaryColor || "var(--blue)"} 50%, black))`,
              display: "grid",
              placeItems: "center",
              color: "rgba(255,255,255,0.7)",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {i18n.t('common.image')}
          </div>
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
              {marketplaceName || i18n.t('...create.createMarketplaceWizard.yourMarketplace')}
            </div>
            <div style={{ fontWeight: 500, marginTop: 2 }}>{i18n.t('...create.createMarketplaceWizard.sampleListingTitle')}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>$1,250</span>
              <span style={{ color: "var(--muted)", fontSize: 10 }}>{i18n.t('...create.createMarketplaceWizard.postedJustNow')}</span>
            </div>
            {chipFields.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                {chipFields.map((f) => (
                  <span
                    key={f.uid}
                    style={{
                      fontSize: 9.5,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "var(--bg-soft)",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {f.label || i18n.t('...create.createMarketplaceWizard.field')}: {sampleFor(f)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SchemaPreview({ fields, marketplaceName }: { fields: SchemaField[]; marketplaceName: string }) {
  return (
    <>
      <div className="pv-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
          <circle cx="12" cy="12" r="3" />
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        </svg>
        {i18n.t('...create.createMarketplaceWizard.sellersCreatelistingForm')}
      </div>
      <div className="pv-frame">
        <div className="pv-card">
          <div className="pv-title">{i18n.t('...create.createMarketplaceWizard.newListing')} {marketplaceName || i18n.t('...create.createMarketplaceWizard.yourMarketplace')}</div>
          <div className="pv-field">
            <div className="fl">{i18n.t('common.title')} <span className="req">*</span></div>
            <div className="fake-input" />
          </div>
          <div className="pv-field">
            <div className="fl">{i18n.t('common.price')} <span className="req">*</span></div>
            <div className="fake-num" />
          </div>
          <div className="pv-field">
            <div className="fl">{i18n.t('...create.createMarketplaceWizard.images')} <span className="req">*</span></div>
            <div className="fake-upload">{i18n.t('...create.createMarketplaceWizard.upload')}</div>
          </div>
          {fields.map((f) => (
            <div key={f.uid} className="pv-field">
              <div className="fl">
                {f.label || i18n.t('...create.createMarketplaceWizard.field')}
                {f.required && <span className="req">*</span>}
                {f.helpText && <span className="tip">{f.helpText}</span>}
              </div>
              {fakeMockFor(f.type, f.options)}
            </div>
          ))}
          {fields.length === 0 && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{i18n.t('...create.createMarketplaceWizard.addFieldsAboveToPreview')}</div>
          )}
        </div>
      </div>
    </>
  );
}

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
        <CardTitle>{i18n.t('common.identity')}</CardTitle>
        <CardDescription>{i18n.t('common.howMembersWillRecognizeYour')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label htmlFor="mp-name" required>
            {i18n.t('common.marketplaceName')}
          </Label>
          <Input
            id="mp-name"
            data-testid="field-name"
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
            placeholder={i18n.t('...create.createMarketplaceWizard.egRivieraWatchClubPlaceholder')}
            maxLength={100}
            aria-invalid={!!errors.name}
          />
          {errors.name ? (
            <Help error>{errors.name}</Help>
          ) : (
            <Help>{i18n.t('...create.createMarketplaceWizard.3100CharactersShownOnYour')}</Help>
          )}
        </div>

        <div>
          <Label htmlFor="mp-slug" required>
            {i18n.t('common.urlSlug')}
          </Label>
          <div className="flex items-stretch rounded-[10px] border border-line bg-surface overflow-hidden focus-within:border-blue focus-within:ring-[3px] focus-within:ring-[var(--blue-softer)]">
            <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-r border-line select-none">
              {i18n.t('common.shoukscomm')}
            </span>
            <input
              id="mp-slug"
              data-testid="field-slug"
              value={state.slug}
              onChange={(e) =>
                setState((s) => ({ ...s, slug: e.target.value.toLowerCase(), slugTouched: true }))
              }
              placeholder={i18n.t('...create.createMarketplaceWizard.slugPlaceholder')}
              className="flex-1 h-[38px] px-3 bg-transparent text-[14px] outline-none"
              aria-invalid={!!errors.slug}
            />
          </div>
          {errors.slug ? (
            <Help error>{errors.slug}</Help>
          ) : (
            <Help>{i18n.t('...create.createMarketplaceWizard.lowercaseLettersNumbersAndHyphens')}</Help>
          )}
        </div>

        <div>
          <Label htmlFor="mp-tagline">{i18n.t('common.tagline')}</Label>
          <Input
            id="mp-tagline"
            value={state.tagline}
            onChange={(e) => setState((s) => ({ ...s, tagline: e.target.value }))}
            placeholder={i18n.t('common.aOnelinerThatCapturesThe')}
            maxLength={140}
          />
          <Help>{i18n.t('common.upTo140Characters')}</Help>
        </div>

        <div>
          <Label htmlFor="mp-description">{i18n.t('common.description')}</Label>
          <Textarea
            id="mp-description"
            data-testid="field-description"
            value={state.description}
            onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
            placeholder={i18n.t('...create.createMarketplaceWizard.whatsThisCommunityForWhoPlaceholder')}
            maxLength={500}
            rows={4}
            aria-invalid={!!errors.description}
          />
          {errors.description ? (
            <Help error>{errors.description}</Help>
          ) : (
            <Help>{i18n.t('...create.createMarketplaceWizard.length500Characters', { length: state.description.length })}</Help>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label required>{i18n.t('...create.createMarketplaceWizard.category')}</Label>
            <Select
              value={state.category || undefined}
              onValueChange={(v) => setState((s) => ({ ...s, category: v }))}
            >
              <SelectTrigger data-testid="field-category" aria-invalid={!!errors.category}>
                <SelectValue placeholder={i18n.t('...create.createMarketplaceWizard.chooseACategoryPlaceholder')} />
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
            <Label htmlFor="mp-color">{i18n.t('common.primaryColor')}</Label>
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
                placeholder={i18n.t('...create.createMarketplaceWizard.colorPlaceholder')}
                maxLength={7}
                aria-invalid={!!errors.primaryColor}
              />
              <input
                type="color"
                aria-label={i18n.t('common.pickAColor')}
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
              <Help>{i18n.t('...create.createMarketplaceWizard.usedForAccentsOnYour')}</Help>
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
            <CardTitle>{i18n.t('common.listingSchema')}</CardTitle>
            <CardDescription>
              {i18n.t('...create.createMarketplaceWizard.defineWhatEveryListingIn')}
            </CardDescription>
          </div>
          <Badge>
            {i18n.t('...create.createMarketplaceWizard.length25Fields', { length: fields.length })}
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
            <Plus size={16} /> {i18n.t('common.addField')}
          </Button>
          {fields.length >= 25 && (
            <Help className="mt-1">{i18n.t('...create.createMarketplaceWizard.youveReachedThe25fieldMaximum')}</Help>
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
            aria-label={i18n.t('common.moveUp')}
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label={i18n.t('common.moveDown')}
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowDown size={14} />
          </button>
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`f-${field.uid}-label`} required>
              {i18n.t('common.displayName')}
            </Label>
            <Input
              id={`f-${field.uid}-label`}
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder={i18n.t('common.egCondition')}
              maxLength={80}
              aria-invalid={!!errors[`field-${index}-label`]}
            />
            {errors[`field-${index}-label`] && (
              <Help error>{errors[`field-${index}-label`]}</Help>
            )}
          </div>

          <div>
            <Label>{i18n.t('common.fieldType')}</Label>
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
            <Label htmlFor={`f-${field.uid}-help`}>{i18n.t('common.helpText')}</Label>
            <Input
              id={`f-${field.uid}-help`}
              value={field.helpText ?? ""}
              onChange={(e) => onChange({ helpText: e.target.value })}
              placeholder={i18n.t('common.shownUnderTheFieldWhen')}
              maxLength={200}
            />
          </div>

          {(field.type === "SELECT" || field.type === "MULTI_SELECT") && (
            <div className="md:col-span-2">
              <Label required>{i18n.t('common.options')}</Label>
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
                <Label htmlFor={`f-${field.uid}-min`}>{i18n.t('common.minImages')}</Label>
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
                <Label htmlFor={`f-${field.uid}-max`}>{i18n.t('common.maxImages')}</Label>
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
            aria-label={i18n.t('common.removeField')}
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
          <label className="inline-flex items-center gap-2 text-[12px] text-ink-soft">
            <Switch
              checked={field.required}
              onCheckedChange={(v) => onChange({ required: !!v })}
              aria-label={i18n.t('common.requiredField')}
            />
            {i18n.t('common.required')}
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
            placeholder={i18n.t('common.optionVar0', { var0: i + 1 })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={i18n.t('common.removeOption')}
            className="h-[38px] w-[38px] grid place-items-center rounded-[10px] border border-line text-ink-soft hover:bg-hover hover:text-danger shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={add}>
        <Plus size={14} /> {i18n.t('common.addOption')}
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

  type Visibility = "PUBLIC" | "CLOSED" | "PRIVATE";

  // SHK-041/SHK-045: visibility (Public/Closed/Private) is independent of
  // the entry method, mirroring the IdentityForm. Private just means
  // unlisted=true.
  function visibilityOf(em: EntryMethod, unlisted: boolean): Visibility {
    if (em === "PUBLIC") return "PUBLIC";
    if (unlisted) return "PRIVATE";
    return "CLOSED";
  }

  function setVisibility(v: Visibility) {
    setState((s) => {
      if (v === "PUBLIC") return { ...s, entryMethod: "PUBLIC", unlisted: false };
      if (v === "PRIVATE") {
        const em = s.entryMethod === "PUBLIC" ? "APPLICATION" : s.entryMethod;
        return { ...s, entryMethod: em, unlisted: true };
      }
      const em = s.entryMethod === "PUBLIC" ? "APPLICATION" : s.entryMethod;
      return { ...s, entryMethod: em, unlisted: false };
    });
  }

  const visibility = visibilityOf(state.entryMethod, state.unlisted);

  const visibilityOptions: { id: Visibility; title: string; body: string; tag: string; testid: string }[] = [
    {
      id: "PUBLIC",
      title: i18n.t('common.public'),
      body: "Anyone can discover the marketplace and browse listings. Best for open communities and merchants who want organic traffic.",
      tag: "OPEN",
      testid: "entry-method-public",
    },
    {
      id: "CLOSED",
      title: i18n.t('common.closed'),
      body: 'Marketplace is listed publicly, but only members can browse listings. Non-members see a "Request to join" page. Best for most curated communities.',
      tag: "GATED",
      testid: "entry-method-closed",
    },
    {
      id: "PRIVATE",
      title: i18n.t('common.private'),
      body: "Hidden from Explore and search. Only direct invite links lead to the marketplace. Best for small trusted groups and beta launches.",
      tag: "HIDDEN",
      testid: "entry-method-invite",
    },
  ];

  const joinOptions: { id: "APPLICATION" | "REFERRAL" | "INVITE"; title: string; body: string; testid: string }[] = [
    {
      id: "APPLICATION",
      title: i18n.t('common.application'),
      body: "Prospective members answer questions you define. You review and approve or reject each one.",
      testid: "join-method-application",
    },
    {
      id: "REFERRAL",
      title: i18n.t('common.referral'),
      body: "Existing members vouch for newcomers. Optionally auto-approve referrals.",
      testid: "join-method-referral",
    },
    {
      id: "INVITE",
      title: i18n.t('common.inviteOnly'),
      body: "Only people you invite (or who follow a direct invite link) can join. No application required.",
      testid: "join-method-invite",
    },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{i18n.t('...create.createMarketplaceWizard.whoBelongsHere')}</CardTitle>
          <CardDescription>
            {i18n.t('...create.createMarketplaceWizard.chooseHowMembersFindAnd')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="section-label">{i18n.t('common.visibility')}</div>
            <div className="space-y-2" role="radiogroup" aria-label={i18n.t('common.visibility')}>
              {visibilityOptions.map((opt) => {
                const selected = visibility === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-testid={opt.testid}
                    onClick={() => setVisibility(opt.id)}
                    className={cn("radio-card", selected && "on")}
                  >
                    <div className="rc-ball" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <div className="rc-t">{opt.title}</div>
                      <div className="rc-s">{opt.body}</div>
                    </div>
                    <span className="rc-tag">{opt.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {(visibility === "CLOSED" || visibility === "PRIVATE") && (
            <div>
              <div className="section-label" style={{ marginTop: 8 }}>{i18n.t('common.waysToJoin')}</div>
              <div className="space-y-2" role="radiogroup" aria-label={i18n.t('common.waysToJoin')}>
                {joinOptions.map((opt) => {
                  const selected = state.entryMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-testid={opt.testid}
                      onClick={() => setState((s) => ({ ...s, entryMethod: opt.id }))}
                      className={cn("radio-card", selected && "on")}
                    >
                      <div className="rc-ball" aria-hidden />
                      <div className="flex-1 min-w-0">
                        <div className="rc-t">{opt.title}</div>
                        <div className="rc-s">{opt.body}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {state.entryMethod === "REFERRAL" && (
                <label className="mt-3 flex items-center gap-3 rounded-[10px] border border-line-soft bg-bg-panel px-3 py-2.5">
                  <Switch
                    checked={state.autoApprove}
                    onCheckedChange={(v) => setState((s) => ({ ...s, autoApprove: !!v }))}
                  />
                  <span className="text-[13px]">
                    <span className="font-medium">{i18n.t('...create.createMarketplaceWizard.autoapproveReferrals')}</span>
                    <span className="block text-muted text-[12px]">{i18n.t('...create.createMarketplaceWizard.skipManualReviewOnceA')}</span>
                  </span>
                </label>
              )}

              {/* SHK-065: when APPLICATION is the join method, let the
                  creator opt out of asking questions. Off = "anyone can
                  request to join, owner approves manually, no form". */}
              {state.entryMethod === "APPLICATION" && (
                <label className="mt-3 flex items-center gap-3 rounded-[10px] border border-line-soft bg-bg-panel px-3 py-2.5">
                  <Switch
                    checked={state.requiresApplication}
                    onCheckedChange={(v) =>
                      setState((s) => ({ ...s, requiresApplication: !!v }))
                    }
                    data-testid="requires-application-toggle"
                  />
                  <span className="text-[13px]">
                    <span className="font-medium">Require an application form</span>
                    <span className="block text-muted text-[12px]">
                      Off: applicants tap "Request to join" and you approve them manually — no questions asked.
                    </span>
                  </span>
                </label>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{i18n.t('common.requiredVerifications')}</CardTitle>
          <CardDescription>
            {i18n.t('common.pickAtLeastOneNew')}
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

      {state.entryMethod === "APPLICATION" && state.requiresApplication && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{i18n.t('common.applicationQuestions')}</CardTitle>
                <CardDescription>
                  {i18n.t('...create.createMarketplaceWizard.whatDoApplicantsNeedTo')}
                </CardDescription>
              </div>
              <Badge>{state.applicationQuestions.length === 1
                ? i18n.t('...create.createMarketplaceWizard.questionCount', { length: state.applicationQuestions.length })
                : i18n.t('...create.createMarketplaceWizard.questionCountPlural', { length: state.applicationQuestions.length })}</Badge>
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
                <p className="text-[13px] text-muted">{i18n.t('common.noQuestionsYet')}</p>
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
                      { uid: uid(), label: "", type: "SHORT_TEXT", required: true },
                    ],
                  }))
                }
                disabled={state.applicationQuestions.length >= 10}
                className="gap-1.5"
              >
                <Plus size={16} /> {i18n.t('common.addQuestion')}
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
            {i18n.t('common.question')}
          </Label>
          <Input
            id={`q-${question.uid}-label`}
            value={question.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={i18n.t('common.egWhatBrandsDoYou')}
            maxLength={200}
            aria-invalid={!!errors[`q-${index}-label`]}
          />
          {errors[`q-${index}-label`] && <Help error>{errors[`q-${index}-label`]}</Help>}
        </div>

        <div>
          <Label>{i18n.t('common.answerType')}</Label>
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
            aria-label={i18n.t('common.removeQuestion')}
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
          <label className="inline-flex items-center gap-2 text-[12px] text-ink-soft">
            <Switch
              checked={question.required}
              onCheckedChange={(v) => onChange({ required: !!v })}
              aria-label={i18n.t('common.requiredQuestion')}
            />
            {i18n.t('common.required')}
          </label>
        </div>

        {(question.type === "SELECT" || question.type === "MULTI_SELECT") && (
          <div className="md:col-span-3">
            <Label required>{i18n.t('common.options')}</Label>
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
          <CardTitle>{i18n.t('common.membershipPricing')}</CardTitle>
          <CardDescription>{i18n.t('common.freeOrSubscriptionbased')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" aria-label={i18n.t('common.pricing')}>
            <PricingOption
              testid="pricing-free"
              active={!state.isPaid}
              title={i18n.t('common.free')}
              body="Anyone approved can join at no cost."
              onClick={() => setState((s) => ({ ...s, isPaid: false }))}
            />
            <PricingOption
              testid="pricing-paid"
              active={state.isPaid}
              title={i18n.t('common.paidMembership')}
              body="Charge monthly, annually, or both."
              onClick={() => setState((s) => ({ ...s, isPaid: true }))}
            />
          </div>

          {state.isPaid && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-[10px] border border-line-soft bg-bg-panel p-4">
              <div>
                <Label htmlFor="price-monthly">{i18n.t('common.monthlyPriceUsd')}</Label>
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
                    {i18n.t('...create.createMarketplaceWizard.perMonth')}
                  </span>
                </div>
                {errors.monthlyPrice && <Help error>{errors.monthlyPrice}</Help>}
              </div>
              <div>
                <Label htmlFor="price-annual">{i18n.t('common.annualPriceUsd')}</Label>
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
                    {i18n.t('...create.createMarketplaceWizard.perYear')}
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

      {/* Rules & behavior card is hidden for V1 (SHK-027 auctions,
          SHK-041 listing moderation). State fields stay in place so we
          can re-expose without a migration. */}

      <div className="rounded-[10px] border border-blue/20 bg-blue-soft px-4 py-3 flex items-start gap-3">
        <Sparkles size={18} className="text-blue-ink shrink-0 mt-0.5" />
        <div className="text-[13px] text-ink-soft">
          <span className="font-medium text-ink">{i18n.t('...create.createMarketplaceWizard.readyToLaunch')}</span> {i18n.t('...create.createMarketplaceWizard.hitPublishAndWellSpin')}
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
          {i18n.t('...create.createMarketplaceWizard.stepXOfYTitle', { step, length: STEPS.length, title: STEPS[step - 1].title })}
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
            <ArrowLeft size={16} /> {i18n.t('common.back')}
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
              {i18n.t('common.next')} <ArrowRight size={16} />
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
              {submitting ? i18n.t('common.publishing') : i18n.t('...create.createMarketplaceWizard.publishMarketplace')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

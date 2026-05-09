"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { cn, verifyProviders } from "@/lib/utils";
import { i18n } from '@shipeasy/sdk/client'

type EntryMethod = "APPLICATION" | "INVITE" | "REFERRAL" | "PUBLIC";
type VerifyProviderId = (typeof verifyProviders)[number]["id"];

type QuestionType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "SELECT"
  | "MULTI_SELECT"
  | "DATE";

type Question = {
  uid: string;
  id?: string;
  order: number;
  label: string;
  helpText?: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
};

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "SHORT_TEXT", label: i18n.t('common.shortText') },
  { value: "LONG_TEXT", label: i18n.t('common.longText') },
  { value: "NUMBER", label: i18n.t('common.number') },
  { value: "SELECT", label: i18n.t('common.singleSelect') },
  { value: "MULTI_SELECT", label: i18n.t('common.multiSelect') },
  { value: "DATE", label: i18n.t('common.date') },
];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function RulesForm({
  slug,
  initial,
}: {
  slug: string;
  initial: {
    entryMethod: EntryMethod;
    requiredVerifications: VerifyProviderId[];
    autoApprove: boolean;
    questions: {
      id: string;
      order: number;
      label: string;
      helpText: string;
      type: string;
      required: boolean;
      options: string[];
    }[];
  };
}) {
  const router = useRouter();
  // entryMethod is managed in Identity > Privacy — read-only here so we can
  // conditionally show application questions.
  const entryMethod = initial.entryMethod;
  const [requiredVerifications, setRequiredVerifications] =
    React.useState<VerifyProviderId[]>(initial.requiredVerifications);
  const [questions, setQuestions] = React.useState<Question[]>(() =>
    initial.questions.map((q) => ({
      uid: uid(),
      id: q.id,
      order: q.order,
      label: q.label,
      helpText: q.helpText,
      type: (q.type as QuestionType) ?? "SHORT_TEXT",
      required: q.required,
      options: q.options,
    })),
  );
  const [saving, setSaving] = React.useState(false);

  function toggleVerify(id: VerifyProviderId) {
    setRequiredVerifications((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function updateQuestion(idx: number, patch: Partial<Question>) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        const next: Question = { ...q, ...patch };
        if (patch.type && patch.type !== q.type) {
          if (patch.type === "SELECT" || patch.type === "MULTI_SELECT") {
            next.options = q.options ?? [""];
          } else {
            next.options = undefined;
          }
        }
        return next;
      }),
    );
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        uid: uid(),
        order: prev.length,
        label: "",
        type: "SHORT_TEXT",
        required: true,
      },
    ]);
  }

  function validate(): string | null {
    if (requiredVerifications.length < 1)
      return "Pick at least one required verification.";
    if (entryMethod === "APPLICATION") {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.label.trim()) return `Question ${i + 1}: label is required.`;
        if (
          (q.type === "SELECT" || q.type === "MULTI_SELECT") &&
          (!q.options || q.options.filter((o) => o.trim()).length < 1)
        )
          return `Question ${i + 1}: add at least one option.`;
      }
    }
    return null;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const mpRes = await fetch(`/api/marketplaces/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiredVerifications }),
      });
      if (!mpRes.ok) {
        const j = await mpRes.json().catch(() => ({}));
        toast.error(j?.error ?? i18n.t('...rules.rulesForm.couldntSaveRules'));
        return;
      }

      const qRes = await fetch(`/api/marketplaces/${slug}/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields:
            entryMethod === "APPLICATION"
              ? questions.map((q, i) => ({
                  id: q.id,
                  order: i,
                  label: q.label.trim(),
                  helpText: q.helpText?.trim() || null,
                  type: q.type,
                  required: !!q.required,
                  options:
                    q.type === "SELECT" || q.type === "MULTI_SELECT"
                      ? (q.options ?? []).filter((o) => o.trim())
                      : null,
                }))
              : [],
        }),
      });
      if (!qRes.ok) {
        const j = await qRes.json().catch(() => ({}));
        toast.error(j?.error ?? i18n.t('...rules.rulesForm.couldntSaveApplicationQuestions'));
        return;
      }

      toast.success(i18n.t('...rules.rulesForm.membershipRulesSaved'));
      router.refresh();
    } catch {
      toast.error(i18n.t('common.networkErrorPleaseTryAgain'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} data-testid="rules-form" className="space-y-5">
      <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
        {i18n.t('common.membershipRules')}
      </h2>
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
              const checked = requiredVerifications.includes(p.id);
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
                    data-testid={`rules-verify-${p.id}`}
                    onChange={() => toggleVerify(p.id)}
                    className="h-4 w-4 rounded border-line text-blue focus:ring-blue"
                  />
                  <span className="text-[13.5px] font-medium">{p.label}</span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {entryMethod === "APPLICATION" && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{i18n.t('common.applicationQuestions')}</CardTitle>
                <CardDescription>
                  {i18n.t('...rules.rulesForm.whatDoApplicantsAnswerLeave')}
                </CardDescription>
              </div>
              <Badge>
                {questions.length === 1
                  ? i18n.t('...rules.rulesForm.questionCount', { length: questions.length })
                  : i18n.t('...rules.rulesForm.questionCountPlural', { length: questions.length })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionRow
                  key={q.uid}
                  question={q}
                  index={i}
                  onChange={(p) => updateQuestion(i, p)}
                  onRemove={() =>
                    setQuestions((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              ))}
              {questions.length === 0 && (
                <p className="text-[13px] text-muted">{i18n.t('common.noQuestionsYet')}</p>
              )}
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                data-testid="rules-add-question"
                onClick={addQuestion}
                className="gap-1.5"
              >
                <Plus size={16} /> {i18n.t('common.addQuestion')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          data-testid="rules-save"
          disabled={saving}
        >
          {saving ? i18n.t('common.saving') : i18n.t('...rules.rulesForm.saveRules')}
        </Button>
      </div>
    </form>
  );
}

function QuestionRow({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: Question;
  index: number;
  onChange: (p: Partial<Question>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      data-testid="rules-question-row"
      className="rounded-[10px] border border-line bg-surface p-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-start">
        <div>
          <Label htmlFor={`q-${question.uid}-label`}>{i18n.t('common.question')}</Label>
          <Input
            id={`q-${question.uid}-label`}
            data-testid={`rules-question-${index}-label`}
            value={question.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={i18n.t('common.egWhatBrandsDoYou')}
            maxLength={200}
          />
        </div>
        <div>
          <Label>{i18n.t('common.answerType')}</Label>
          <Select
            value={question.type}
            onValueChange={(v) => onChange({ type: v as QuestionType })}
          >
            <SelectTrigger data-testid={`rules-question-${index}-type`}>
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
            data-testid={`rules-question-${index}-remove`}
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
          <label className="inline-flex items-center gap-2 text-[12px] text-ink-soft">
            <Switch
              checked={question.required}
              onCheckedChange={(v) => onChange({ required: !!v })}
              data-testid={`rules-question-${index}-required`}
              aria-label={i18n.t('common.requiredQuestion')}
            />
            {i18n.t('common.required')}
          </label>
        </div>

        {(question.type === "SELECT" || question.type === "MULTI_SELECT") && (
          <div className="md:col-span-3">
            <Label>{i18n.t('common.options')}</Label>
            <div className="space-y-2">
              {(question.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...(question.options ?? [])];
                      next[i] = e.target.value;
                      onChange({ options: next });
                    }}
                    placeholder={i18n.t('common.optionVar0', { var0: i + 1 })}
                  />
                  <button
                    type="button"
                    aria-label={i18n.t('common.removeOption')}
                    onClick={() =>
                      onChange({
                        options: (question.options ?? []).filter((_, idx) => idx !== i),
                      })
                    }
                    className="h-[38px] w-[38px] grid place-items-center rounded-[10px] border border-line text-ink-soft hover:bg-hover hover:text-danger shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() =>
                  onChange({ options: [...(question.options ?? []), ""] })
                }
              >
                <Plus size={14} /> {i18n.t('common.addOption')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

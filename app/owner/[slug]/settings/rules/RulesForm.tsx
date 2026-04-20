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

type EntryMethod = "APPLICATION" | "INVITE" | "REFERRAL";
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
  { value: "SHORT_TEXT", label: "Short text" },
  { value: "LONG_TEXT", label: "Long text" },
  { value: "NUMBER", label: "Number" },
  { value: "SELECT", label: "Single select" },
  { value: "MULTI_SELECT", label: "Multi select" },
  { value: "DATE", label: "Date" },
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
  const [entryMethod, setEntryMethod] = React.useState<EntryMethod>(
    initial.entryMethod,
  );
  const [requiredVerifications, setRequiredVerifications] =
    React.useState<VerifyProviderId[]>(initial.requiredVerifications);
  const [autoApprove, setAutoApprove] = React.useState(initial.autoApprove);
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
        body: JSON.stringify({
          entryMethod,
          requiredVerifications,
          autoApprove: entryMethod === "REFERRAL" ? autoApprove : false,
        }),
      });
      if (!mpRes.ok) {
        const j = await mpRes.json().catch(() => ({}));
        toast.error(j?.error ?? "Couldn't save rules.");
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
        toast.error(j?.error ?? "Couldn't save application questions.");
        return;
      }

      toast.success("Membership rules saved.");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
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
      testid: "rules-entry-application",
    },
    {
      id: "INVITE",
      title: "Invite link or code",
      body: "Share a link or code. Holders can join instantly.",
      testid: "rules-entry-invite",
    },
    {
      id: "REFERRAL",
      title: "Referral",
      body: "Existing members vouch for newcomers.",
      testid: "rules-entry-referral",
    },
  ];

  return (
    <form onSubmit={save} data-testid="rules-form" className="space-y-5">
      <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
        Membership rules
      </h2>
      <Card>
        <CardHeader>
          <CardTitle>How do people join?</CardTitle>
          <CardDescription>Pick a single entry method.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
            role="radiogroup"
            aria-label="Entry method"
          >
            {entryOptions.map((opt) => {
              const selected = entryMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-testid={opt.testid}
                  onClick={() => setEntryMethod(opt.id)}
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

          {entryMethod === "REFERRAL" && (
            <label className="mt-4 flex items-center gap-3 rounded-[10px] border border-line-soft bg-bg-panel px-3 py-2.5">
              <Switch
                checked={autoApprove}
                onCheckedChange={(v) => setAutoApprove(!!v)}
                data-testid="rules-auto-approve"
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
                <CardTitle>Application questions</CardTitle>
                <CardDescription>
                  What do applicants answer? Leave empty for a frictionless apply.
                </CardDescription>
              </div>
              <Badge>
                {questions.length} question{questions.length === 1 ? "" : "s"}
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
                <p className="text-[13px] text-muted">No questions yet.</p>
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
                <Plus size={16} /> Add question
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
          {saving ? "Saving…" : "Save rules"}
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
          <Label htmlFor={`q-${question.uid}-label`}>Question</Label>
          <Input
            id={`q-${question.uid}-label`}
            data-testid={`rules-question-${index}-label`}
            value={question.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. What brands do you collect?"
            maxLength={200}
          />
        </div>
        <div>
          <Label>Answer type</Label>
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
            aria-label="Remove question"
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
              aria-label="Required question"
            />
            Required
          </label>
        </div>

        {(question.type === "SELECT" || question.type === "MULTI_SELECT") && (
          <div className="md:col-span-3">
            <Label>Options</Label>
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
                    placeholder={`Option ${i + 1}`}
                  />
                  <button
                    type="button"
                    aria-label="Remove option"
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
                <Plus size={14} /> Add option
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type FieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "CURRENCY"
  | "SELECT"
  | "MULTI_SELECT"
  | "DATE"
  | "IMAGE";

type Field = {
  uid: string;
  id?: string;
  order: number;
  name: string;
  label: string;
  helpText?: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  minImages?: number | null;
  maxImages?: number | null;
  archived?: boolean;
};

type Initial = {
  id: string;
  order: number;
  name: string;
  label: string;
  helpText: string;
  type: FieldType;
  required: boolean;
  options: string[];
  minImages: number | null;
  maxImages: number | null;
  archived: boolean;
};

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

export function SchemaEditor({
  slug,
  initial,
}: {
  slug: string;
  initial: Initial[];
}) {
  const router = useRouter();
  const [fields, setFields] = React.useState<Field[]>(() =>
    initial
      .filter((f) => !f.archived)
      .map((f) => ({
        uid: uid(),
        id: f.id,
        order: f.order,
        name: f.name,
        label: f.label,
        helpText: f.helpText,
        type: f.type,
        required: f.required,
        options: f.options,
        minImages: f.minImages,
        maxImages: f.maxImages,
        archived: false,
      })),
  );
  const [archived, setArchived] = React.useState<Field[]>(() =>
    initial
      .filter((f) => f.archived)
      .map((f) => ({
        uid: uid(),
        id: f.id,
        order: f.order,
        name: f.name,
        label: f.label,
        helpText: f.helpText,
        type: f.type,
        required: f.required,
        options: f.options,
        minImages: f.minImages,
        maxImages: f.maxImages,
        archived: true,
      })),
  );
  const [showArchived, setShowArchived] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const originalIds = new Set(initial.filter((f) => !f.archived).map((f) => f.id));
  const activeIds = new Set(fields.map((f) => f.id).filter(Boolean) as string[]);
  const removedFromActive = [...originalIds].filter((id) => !activeIds.has(id));
  const isDirty = React.useMemo(() => {
    // Treat any difference as dirty.
    if (fields.length !== initial.filter((f) => !f.archived).length) return true;
    for (let i = 0; i < fields.length; i++) {
      const a = fields[i];
      const b = initial[i];
      if (!b) return true;
      if (a.id !== b.id) return true;
      if (a.label !== b.label) return true;
      if (a.type !== b.type) return true;
      if (a.required !== b.required) return true;
      if ((a.helpText ?? "") !== (b.helpText ?? "")) return true;
      if (JSON.stringify(a.options ?? []) !== JSON.stringify(b.options ?? [])) return true;
      if ((a.minImages ?? null) !== (b.minImages ?? null)) return true;
      if ((a.maxImages ?? null) !== (b.maxImages ?? null)) return true;
    }
    return false;
  }, [fields, initial]);

  function update(idx: number, patch: Partial<Field>) {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== idx) return f;
        const next: Field = { ...f, ...patch };
        if (patch.label !== undefined) next.name = toFieldName(patch.label || f.label);
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
            next.minImages = null;
            next.maxImages = null;
          }
        }
        return next;
      }),
    );
  }

  function move(idx: number, dir: -1 | 1) {
    setFields((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function remove(idx: number) {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  }

  function restoreArchived(uidToRestore: string) {
    const f = archived.find((x) => x.uid === uidToRestore);
    if (!f) return;
    setArchived((prev) => prev.filter((x) => x.uid !== uidToRestore));
    setFields((prev) => [...prev, { ...f, archived: false }]);
  }

  function addField() {
    if (fields.length >= 25) return;
    setFields((prev) => [
      ...prev,
      {
        uid: uid(),
        order: prev.length,
        name: "field",
        label: "",
        type: "SHORT_TEXT",
        required: false,
      },
    ]);
  }

  function validate(): string | null {
    if (fields.length < 1) return "Add at least one field.";
    if (fields.length > 25) return "Maximum of 25 fields.";
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.label.trim()) return `Field ${i + 1}: display name is required.`;
      if ((f.type === "SELECT" || f.type === "MULTI_SELECT") && (!f.options || f.options.filter((o) => o.trim()).length < 1))
        return `Field ${i + 1}: add at least one option.`;
      if (f.type === "IMAGE") {
        const min = f.minImages ?? 0;
        const max = f.maxImages ?? 1;
        if (max < 1 || max > 20) return `Field ${i + 1}: max images must be 1–20.`;
        if (min < 0 || min > max) return `Field ${i + 1}: min images must be ≤ max.`;
      }
    }
    return null;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmSave() {
    setSaving(true);
    try {
      const payload = {
        fields: fields.map((f, i) => ({
          id: f.id,
          order: i,
          name: f.name || toFieldName(f.label),
          label: f.label.trim(),
          helpText: f.helpText?.trim() || null,
          type: f.type,
          required: !!f.required,
          options:
            f.type === "SELECT" || f.type === "MULTI_SELECT"
              ? (f.options ?? []).filter((o) => o.trim())
              : null,
          minImages: f.type === "IMAGE" ? f.minImages ?? 0 : null,
          maxImages: f.type === "IMAGE" ? f.maxImages ?? 10 : null,
          archived: false,
        })),
      };
      const res = await fetch(`/api/marketplaces/${slug}/schema`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Couldn't save schema.");
        return;
      }
      toast.success(
        `Schema saved${
          json.archived > 0 ? ` — ${json.archived} field(s) archived` : ""
        }.`,
      );
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} data-testid="schema-form" className="space-y-5">
      <div className="rounded-[10px] border border-warn/20 bg-warn-soft px-4 py-3 flex items-start gap-3">
        <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
        <div className="text-[13px] text-ink-soft">
          <span className="font-medium text-ink">Heads up:</span> changing the
          schema affects every existing listing. Removed fields with live data are
          archived (not deleted) to preserve history.
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Listing schema</CardTitle>
              <CardDescription>
                Define what every listing in this marketplace looks like. Up to 25
                fields.
              </CardDescription>
            </div>
            <Badge>
              {fields.length}/25 fields
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <FieldRow
                key={f.uid}
                field={f}
                index={i}
                total={fields.length}
                onChange={(p) => update(i, p)}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                onRemove={() => remove(i)}
              />
            ))}
            {fields.length === 0 && (
              <p className="text-[13px] text-muted">No fields yet.</p>
            )}
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              data-testid="schema-add-field"
              onClick={addField}
              disabled={fields.length >= 25}
              className="gap-1.5"
            >
              <Plus size={16} /> Add field
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            variant="primary"
            data-testid="schema-save"
            disabled={!isDirty || saving}
          >
            Save schema
          </Button>
        </CardFooter>
      </Card>

      {archived.length > 0 && (
        <Card>
          <CardHeader>
            <button
              type="button"
              onClick={() => setShowArchived((s) => !s)}
              className="w-full flex items-center justify-between text-left"
              data-testid="schema-toggle-archived"
            >
              <div>
                <CardTitle>Archived fields</CardTitle>
                <CardDescription>
                  {archived.length} field{archived.length === 1 ? "" : "s"} hidden
                  from the listing form but preserved on existing listings.
                </CardDescription>
              </div>
              {showArchived ? (
                <ChevronUp size={18} className="text-muted" />
              ) : (
                <ChevronDown size={18} className="text-muted" />
              )}
            </button>
          </CardHeader>
          {showArchived && (
            <CardContent>
              <ul className="divide-y divide-line-soft">
                {archived.map((f) => (
                  <li
                    key={f.uid}
                    className="flex items-center justify-between py-3 gap-3"
                    data-testid="schema-archived-row"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium truncate">
                        {f.label}
                      </div>
                      <div className="text-[12px] text-muted">
                        {f.type} · {f.name}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      data-testid={`schema-restore-${f.name}`}
                      onClick={() => restoreArchived(f.uid)}
                    >
                      <RotateCcw size={14} /> Restore
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-warn-soft grid place-items-center shrink-0">
                <AlertTriangle size={18} className="text-warn" />
              </div>
              <div>
                <DialogTitle>Apply schema changes?</DialogTitle>
                <DialogDescription>
                  These updates will affect every active listing in your
                  marketplace.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <ul className="space-y-1.5 text-[13.5px] text-ink-soft list-disc pl-5">
              <li>New required fields aren't back-filled — sellers see them on edit.</li>
              {removedFromActive.length > 0 && (
                <li>
                  {removedFromActive.length} field(s) will be removed or archived
                  if referenced by listings.
                </li>
              )}
              <li>Option changes apply to new listings and edits.</li>
            </ul>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" data-testid="schema-confirm-cancel">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="primary"
              data-testid="schema-confirm-save"
              onClick={confirmSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Apply changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
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
}: {
  field: Field;
  index: number;
  total: number;
  onChange: (p: Partial<Field>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      data-testid="schema-field-row"
      className={cn(
        "rounded-[10px] border border-line bg-surface p-4 hover:border-line-soft transition",
      )}
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
            <Label htmlFor={`f-${field.uid}-label`}>Display name</Label>
            <Input
              id={`f-${field.uid}-label`}
              data-testid={`schema-field-${index}-label`}
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="e.g. Condition"
              maxLength={80}
            />
          </div>
          <div>
            <Label>Field type</Label>
            <Select
              value={field.type}
              onValueChange={(v) => onChange({ type: v as FieldType })}
            >
              <SelectTrigger data-testid={`schema-field-${index}-type`}>
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
              data-testid={`schema-field-${index}-help`}
              value={field.helpText ?? ""}
              onChange={(e) => onChange({ helpText: e.target.value })}
              placeholder="Shown under the field when sellers fill it out."
              maxLength={200}
            />
          </div>

          {(field.type === "SELECT" || field.type === "MULTI_SELECT") && (
            <div className="md:col-span-2">
              <Label>Options</Label>
              <OptionsEditor
                options={field.options ?? []}
                onChange={(opts) => onChange({ options: opts })}
              />
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
                />
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
                />
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove field"
            data-testid={`schema-field-${index}-remove`}
            className="h-7 w-7 grid place-items-center rounded-[6px] text-ink-soft hover:bg-hover hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
          <label className="inline-flex items-center gap-2 text-[12px] text-ink-soft">
            <Switch
              checked={field.required}
              onCheckedChange={(v) => onChange({ required: !!v })}
              aria-label="Required field"
              data-testid={`schema-field-${index}-required`}
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
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={opt}
            onChange={(e) => {
              const next = [...options];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={`Option ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => onChange(options.filter((_, idx) => idx !== i))}
            aria-label="Remove option"
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
        onClick={() => onChange([...options, ""])}
      >
        <Plus size={14} /> Add option
      </Button>
    </div>
  );
}

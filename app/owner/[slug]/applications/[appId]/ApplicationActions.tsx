"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";

const REJECTION_REASONS = [
  "Insufficient verification",
  "Does not meet criteria",
  "Duplicate account",
  "Other",
];

type Decision = "APPROVE" | "REJECT" | "REQUEST_INFO";

export function ApplicationActions({ appId, slug }: { appId: string; slug: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState<Decision | null>(null);
  const [note, setNote] = React.useState("");
  const [reason, setReason] = React.useState(REJECTION_REASONS[0]);
  const [busy, setBusy] = React.useState(false);

  async function confirm() {
    if (!open) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision: open,
          note: note || undefined,
          rejectionReason: open === "REJECT" ? reason : undefined,
        }),
      });
      if (!res.ok) {
        alert((await res.json().catch(() => null))?.error ?? "Failed");
        return;
      }
      setOpen(null);
      setNote("");
      // Navigate back to the queue index so the next pending app auto-selects.
      router.push(`/owner/${slug}/applications`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => {
            setOpen("APPROVE");
            setNote("");
          }}
          data-testid="app-approve"
        >
          <Check size={15} /> Approve
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            setOpen("REJECT");
            setNote("");
            setReason(REJECTION_REASONS[0]);
          }}
          data-testid="app-reject"
        >
          <X size={15} /> Reject
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen("REQUEST_INFO");
            setNote("");
          }}
          data-testid="app-request-info"
        >
          <HelpCircle size={15} /> Request more info
        </Button>
      </div>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent width={480}>
          <DialogHeader>
            <DialogTitle>
              {open === "APPROVE"
                ? "Approve application"
                : open === "REJECT"
                  ? "Reject application"
                  : "Request more info"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {open === "REJECT" && (
              <div>
                <label className="text-[12px] text-ink-soft block mb-1.5 font-medium">
                  Reason
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger data-testid="app-rejection-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECTION_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-[12px] text-ink-soft block mb-1.5 font-medium">
                Note{open === "REQUEST_INFO" ? "" : " (optional)"}
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  open === "APPROVE"
                    ? "Welcome message (optional)"
                    : open === "REJECT"
                      ? "Optional — shown to the applicant"
                      : "What info is missing?"
                }
                data-testid="app-note"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={open === "REJECT" ? "danger" : "primary"}
              onClick={confirm}
              disabled={busy}
              data-testid="app-confirm"
            >
              {busy
                ? "Working…"
                : open === "APPROVE"
                  ? "Approve"
                  : open === "REJECT"
                    ? "Reject"
                    : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

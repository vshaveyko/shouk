"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Switch,
  Label,
} from "@/components/ui";
import { WhatsAppQRModal } from "@/components/whatsapp/WhatsAppQRModal";

interface Props {
  marketplaceId: string;
  initial: {
    whatsappGroupId: string | null;
    whatsappGroupName: string | null;
    whatsappAutoApproval: boolean;
  };
  inviteStats: { pending: number; accepted: number };
  whatsappEnabled: boolean;
}

export function IntegrationsForm({ marketplaceId, initial, inviteStats, whatsappEnabled }: Props) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [stats, setStats] = useState(inviteStats);
  const [showModal, setShowModal] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const linked = !!state.whatsappGroupId;

  const handleToggleAutoApproval = async (enabled: boolean) => {
    setAutoSaving(true);
    setState((s) => ({ ...s, whatsappAutoApproval: enabled }));
    try {
      const res = await fetch("/api/whatsapp/auto-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplaceId, enabled }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(enabled ? "Auto-approval enabled" : "Auto-approval disabled");
    } catch {
      setState((s) => ({ ...s, whatsappAutoApproval: !enabled }));
      toast.error("Could not update auto-approval");
    } finally {
      setAutoSaving(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Unlink this WhatsApp group? Existing members stay active.")) return;
    setUnlinking(true);
    try {
      const res = await fetch("/api/whatsapp/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplaceId }),
      });
      if (!res.ok) throw new Error("Failed");
      setState({ whatsappGroupId: null, whatsappGroupName: null, whatsappAutoApproval: false });
      toast.success("WhatsApp group unlinked");
      router.refresh();
    } catch {
      toast.error("Could not unlink");
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            WhatsApp group
            {linked ? (
              <Badge variant="approved" data-testid="whatsapp-linked-badge">
                Linked
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            Link a WhatsApp group you admin. New group members can auto-join this marketplace by
            scanning a QR, and you can bulk-import the current roster as phone invites.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!whatsappEnabled && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              WhatsApp integration is disabled on this server. Set <code>WHATSAPP_ENABLED=true</code>{" "}
              to enable.
            </div>
          )}

          {linked ? (
            <div className="rounded-xl border border-line p-4 space-y-3" data-testid="whatsapp-linked-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink-soft">Linked group</p>
                  <p className="font-medium truncate">{state.whatsappGroupName ?? "(unnamed)"}</p>
                  <p className="text-xs text-ink-soft mt-1 font-mono truncate">
                    {state.whatsappGroupId}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUnlink}
                  disabled={unlinking}
                  data-testid="whatsapp-unlink"
                >
                  {unlinking ? "Unlinking…" : "Unlink"}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line">
                <div className="pr-4">
                  <Label htmlFor="auto-approval" className="cursor-pointer">
                    Auto-approve group members
                  </Label>
                  <p className="text-xs text-ink-soft mt-0.5">
                    When on, anyone in the linked WhatsApp group joins instantly after scanning the
                    QR on the apply page.
                  </p>
                </div>
                <Switch
                  id="auto-approval"
                  checked={state.whatsappAutoApproval}
                  disabled={autoSaving}
                  onCheckedChange={handleToggleAutoApproval}
                  data-testid="whatsapp-auto-approval"
                />
              </div>

              <div className="flex gap-4 pt-3 border-t border-line text-sm text-ink-soft">
                <span data-testid="whatsapp-invites-pending">
                  Pending invites: <strong className="text-ink">{stats.pending}</strong>
                </span>
                <span data-testid="whatsapp-invites-accepted">
                  Accepted: <strong className="text-ink">{stats.accepted}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line p-6 text-center space-y-3">
              <p className="text-sm text-ink-soft">No WhatsApp group linked yet.</p>
              <Button
                onClick={() => setShowModal(true)}
                disabled={!whatsappEnabled}
                data-testid="whatsapp-link-button"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Link a WhatsApp group
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-ink-soft">
          Nothing is posted to WhatsApp — we read your group list once, then destroy the session.
        </CardFooter>
      </Card>

      {showModal && (
        <WhatsAppQRModal
          mode="setup"
          marketplaceId={marketplaceId}
          onClose={() => setShowModal(false)}
          onDone={(groupName, synced) => {
            setShowModal(false);
            toast.success(
              synced > 0
                ? `Linked "${groupName}" · synced ${synced} member${synced === 1 ? "" : "s"}`
                : `Linked "${groupName}"`,
            );
            setState((s) => ({
              ...s,
              whatsappGroupName: groupName,
              whatsappGroupId: s.whatsappGroupId ?? "pending-refresh",
            }));
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

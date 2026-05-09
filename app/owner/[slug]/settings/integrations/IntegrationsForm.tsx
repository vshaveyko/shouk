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
import { i18n } from '@shipeasy/sdk/client'

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
      toast.success(enabled ? i18n.t('...integrations.integrationsForm.autoapprovalEnabled') : i18n.t('...integrations.integrationsForm.autoapprovalDisabled'));
    } catch {
      setState((s) => ({ ...s, whatsappAutoApproval: !enabled }));
      toast.error(i18n.t('...integrations.integrationsForm.couldNotUpdateAutoapproval'));
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
      toast.success(i18n.t('...integrations.integrationsForm.whatsappGroupUnlinked'));
      router.refresh();
    } catch {
      toast.error(i18n.t('...integrations.integrationsForm.couldNotUnlink'));
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {i18n.t('...integrations.integrationsForm.whatsappGroup')}
            {linked ? (
              <Badge variant="approved" data-testid="whatsapp-linked-badge">
                {i18n.t('common.linked')}
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            {i18n.t('...integrations.integrationsForm.linkAWhatsappGroupYou')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!whatsappEnabled && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              {i18n.t('...integrations.integrationsForm.whatsappIntegrationIsDisabledOn')} <code>{i18n.t('...integrations.integrationsForm.whatsapp_enabledtrue')}</code>{" "}
              {i18n.t('...integrations.integrationsForm.toEnable')}
            </div>
          )}

          {linked ? (
            <div className="rounded-xl border border-line p-4 space-y-3" data-testid="whatsapp-linked-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink-soft">{i18n.t('...integrations.integrationsForm.linkedGroup')}</p>
                  <p className="font-medium truncate">{state.whatsappGroupName ?? i18n.t('...integrations.integrationsForm.unnamed')}</p>
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
                  {unlinking ? i18n.t('...integrations.integrationsForm.unlinking') : i18n.t('common.unlink')}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line">
                <div className="pr-4">
                  <Label htmlFor="auto-approval" className="cursor-pointer">
                    {i18n.t('...integrations.integrationsForm.autoapproveGroupMembers')}
                  </Label>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {i18n.t('...integrations.integrationsForm.whenOnAnyoneInThe')}
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
                  {i18n.t('...integrations.integrationsForm.pendingInvites')} <strong className="text-ink">{stats.pending}</strong>
                </span>
                <span data-testid="whatsapp-invites-accepted">
                  {i18n.t('...integrations.integrationsForm.accepted')} <strong className="text-ink">{stats.accepted}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line p-6 text-center space-y-3">
              <p className="text-sm text-ink-soft">{i18n.t('...integrations.integrationsForm.noWhatsappGroupLinkedYet')}</p>
              <Button
                onClick={() => setShowModal(true)}
                disabled={!whatsappEnabled}
                data-testid="whatsapp-link-button"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {i18n.t('...integrations.integrationsForm.linkAWhatsappGroup')}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-ink-soft">
          {i18n.t('...integrations.integrationsForm.nothingIsPostedToWhatsapp')}
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
                ? i18n.t('...integrations.integrationsForm.linkedGroupnameSyncedSyncedMembervar2', { groupName, synced, var2: synced === 1 ? "" : "s" })
                : i18n.t('...integrations.integrationsForm.linkedGroupname', { groupName }),
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

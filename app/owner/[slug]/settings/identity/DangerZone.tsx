"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Info } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui";
import { i18n } from "@shipeasy/sdk/client";

type Status = "DRAFT" | "ACTIVE" | "INACTIVE" | "SCHEDULED_DELETION";

export function DangerZone({ slug, status }: { slug: string; status: Status }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function deactivate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/marketplaces/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INACTIVE" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          json?.error ?? i18n.t("...identity.identityForm.couldntDeactivateMarketplace"),
        );
        return;
      }
      toast.success(i18n.t("...identity.identityForm.marketplaceDeactivated"));
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(i18n.t("common.networkErrorPleaseTryAgain"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card className="border-danger/20" data-testid="identity-danger-zone">
        <CardHeader>
          <CardTitle className="text-danger">
            {i18n.t("...identity.identityForm.dangerZone")}
          </CardTitle>
          <CardDescription>
            {i18n.t("...identity.identityForm.deactivatingHidesYourMarketplaceFrom")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line-soft bg-bg-panel px-4 py-3">
            <div className="flex items-start gap-2 min-w-0">
              <Info size={16} className="text-muted mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[14px] font-medium">
                  {i18n.t("...identity.identityForm.status")}{" "}
                  <span
                    className={status === "ACTIVE" ? "text-success" : "text-muted"}
                  >
                    {status}
                  </span>
                </div>
                <div className="text-[12.5px] text-muted">
                  {i18n.t("...identity.identityForm.membersLoseAccessToListings")}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="danger"
              data-testid="identity-deactivate"
              onClick={() => setOpen(true)}
              disabled={status === "INACTIVE"}
            >
              {i18n.t("...identity.identityForm.deactivate")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-danger-soft grid place-items-center shrink-0">
                <AlertTriangle size={18} className="text-danger" />
              </div>
              <div>
                <DialogTitle>
                  {i18n.t("...identity.identityForm.deactivateThisMarketplace")}
                </DialogTitle>
                <DialogDescription>
                  {i18n.t("...identity.identityForm.listingsApplicationsAndMemberActivity")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <ul className="space-y-1.5 text-[13.5px] text-ink-soft list-disc pl-5">
              <li>{i18n.t("...identity.identityForm.membersCannotPostOrBid")}</li>
              <li>{i18n.t("...identity.identityForm.newApplicationsAreBlocked")}</li>
              <li>{i18n.t("...identity.identityForm.thePublicPageShowsAs")}</li>
            </ul>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" data-testid="identity-deactivate-cancel">
                {i18n.t("common.cancel")}
              </Button>
            </DialogClose>
            <Button
              variant="danger"
              data-testid="identity-deactivate-confirm"
              onClick={deactivate}
              disabled={busy}
            >
              {busy
                ? i18n.t("...identity.identityForm.deactivating")
                : i18n.t("...identity.identityForm.yesDeactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

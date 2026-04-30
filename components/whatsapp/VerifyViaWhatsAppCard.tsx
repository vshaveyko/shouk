"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { WhatsAppQRModal } from "./WhatsAppQRModal";

export function VerifyViaWhatsAppCard({
  marketplaceId,
  marketplaceSlug,
  groupName,
}: {
  marketplaceId: string;
  marketplaceSlug: string;
  groupName: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <section
      className="mb-5 rounded-[14px] border border-emerald-200 bg-emerald-50/60 p-5"
      data-testid="whatsapp-verify-card"
    >
      <div className="flex items-start gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.948-1.418A9.945 9.945 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
        </svg>
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold">
            Skip the application — verify with WhatsApp
          </h2>
          <p className="text-[13px] text-ink-soft mt-1">
            If you&apos;re already in{" "}
            <strong>{groupName ?? "the linked group"}</strong> on WhatsApp, scan a QR and
            you&apos;ll be approved instantly.
          </p>
          <div className="mt-3">
            <Button
              onClick={() => setOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="whatsapp-verify-open"
            >
              Verify with WhatsApp
            </Button>
          </div>
        </div>
      </div>
      {open && (
        <WhatsAppQRModal
          mode="verify"
          marketplaceId={marketplaceId}
          groupName={groupName}
          onClose={() => setOpen(false)}
          onDone={({ verified, approved }) => {
            setOpen(false);
            if (approved) {
              toast.success("Approved — welcome!");
              router.push(`/m/${marketplaceSlug}`);
            } else if (verified) {
              toast("You're in the group, but approval didn't complete.");
            } else {
              toast("We couldn't find you in the linked WhatsApp group.");
            }
          }}
        />
      )}
    </section>
  );
}

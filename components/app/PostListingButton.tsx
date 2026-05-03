"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";

type Marketplace = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
};

// SHK-056: replaces the old Post a new listing link with a small picker
// dialog so members in multiple marketplaces don't get silently dropped
// into whichever one happened to be first in the dropdown.
export function PostListingButton({ marketplaces }: { marketplaces: Marketplace[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [picked, setPicked] = React.useState<string | null>(
    marketplaces[0]?.slug ?? null,
  );

  if (marketplaces.length === 0) return null;

  // If there's only one marketplace, skip the picker.
  if (marketplaces.length === 1) {
    const only = marketplaces[0];
    return (
      <button
        type="button"
        onClick={() => router.push(`/m/${only.slug}/new`)}
        className="btn btn-dark"
        style={{ width: "100%", justifyContent: "center", marginTop: 10, height: 32, fontSize: 12 }}
        data-testid="post-listing-button"
      >
        <Plus size={14} /> Post a new listing
      </button>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="btn btn-dark"
          style={{ width: "100%", justifyContent: "center", marginTop: 10, height: 32, fontSize: 12 }}
          data-testid="post-listing-button"
        >
          <Plus size={14} /> Post a new listing
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-[14px] border border-line shadow-xl w-[420px] max-w-[92vw] p-5 z-50"
          data-testid="post-listing-dialog"
        >
          <Dialog.Title className="text-[16px] font-semibold mb-1">Post a new listing</Dialog.Title>
          <Dialog.Description className="text-[13px] text-muted mb-4">
            Pick which marketplace this listing goes in.
          </Dialog.Description>

          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {marketplaces.map((m) => {
              const active = m.slug === picked;
              return (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] border cursor-pointer transition ${
                    active ? "border-blue bg-blue-soft" : "border-line bg-surface hover:bg-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="post-mp"
                    checked={active}
                    onChange={() => setPicked(m.slug)}
                    className="accent-blue"
                  />
                  <span
                    className="w-6 h-6 rounded-[6px] grid place-items-center text-white font-semibold text-[11px] overflow-hidden"
                    style={{ background: m.primaryColor ?? "var(--blue)" }}
                  >
                    {m.logoUrl ? (
                      <img src={m.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      m.name[0]
                    )}
                  </span>
                  <span className="flex-1 truncate text-[14px]">{m.name}</span>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <Dialog.Close asChild>
              <button type="button" className="btn btn-secondary" data-testid="post-listing-cancel">
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              className="btn btn-dark"
              data-testid="post-listing-confirm"
              disabled={!picked}
              onClick={() => {
                if (picked) {
                  setOpen(false);
                  router.push(`/m/${picked}/new`);
                }
              }}
            >
              Continue
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

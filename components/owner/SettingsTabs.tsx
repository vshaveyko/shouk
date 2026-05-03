"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "identity", label: "Identity" },
  { id: "schema", label: "Schema" },
  { id: "monetization", label: "Monetization" },
  { id: "roles", label: "Roles" },
  { id: "integrations", label: "Integrations" },
] as const;

export function SettingsTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/owner/${slug}/settings`;

  return (
    <div className="border-b border-line">
      <div
        className="inline-flex items-center gap-1 overflow-x-auto max-w-full"
        role="tablist"
        aria-label="Settings sections"
      >
        {TABS.map((t) => {
          const href = `${base}/${t.id}`;
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (t.id === "identity" && pathname === base);
          return (
            <Link
              key={t.id}
              href={href}
              role="tab"
              aria-selected={active}
              data-testid={`settings-tab-${t.id}`}
              className={cn(
                "px-3 py-2.5 -mb-px text-[14px] font-medium border-b-2 transition-colors whitespace-nowrap",
                active
                  ? "text-ink border-blue"
                  : "text-ink-soft border-transparent hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

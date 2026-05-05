"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { i18n } from '@shipeasy/sdk/client'

const TABS = [
  { id: "identity", label: i18n.t('...owner.settingsTabs.identity') },
  { id: "schema", label: i18n.t('...owner.settingsTabs.schema') },
  { id: "monetization", label: i18n.t('...owner.settingsTabs.monetization') },
  { id: "roles", label: i18n.t('...owner.settingsTabs.roles') },
  { id: "integrations", label: i18n.t('...owner.settingsTabs.integrations') },
] as const;

export function SettingsTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/owner/${slug}/settings`;

  return (
    <div className="border-b border-line">
      <div
        className="inline-flex items-center gap-1 overflow-x-auto max-w-full"
        role="tablist"
        aria-label={i18n.t('...owner.settingsTabs.settingsSectionsAria-label')}
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

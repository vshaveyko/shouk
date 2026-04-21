"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import type {
  QueueFilters,
  QueueStatusFilter,
  SortFilter,
  VerifFilter,
} from "./filters";

type Counts = { pending: number; approved: number; rejected: number; all: number };

const STATUS_TABS: { key: QueueStatusFilter; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];

const VERIF_OPTIONS: { key: VerifFilter; label: string }[] = [
  { key: "all", label: "All verifications" },
  { key: "full", label: "Fully verified" },
  { key: "partial", label: "Partially verified" },
  { key: "none", label: "Unverified" },
];

const SORT_OPTIONS: { key: SortFilter; label: string }[] = [
  { key: "oldest", label: "Oldest first" },
  { key: "newest", label: "Newest first" },
];

const DEFAULTS: QueueFilters = { status: "PENDING", q: "", verif: "all", sort: "oldest" };

function caret() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function QueueControls({
  slug,
  counts,
  filters,
}: {
  slug: string;
  counts: Counts;
  filters: QueueFilters;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const buildHref = React.useCallback(
    (patch: Partial<QueueFilters>) => {
      const next = new URLSearchParams(sp?.toString() ?? "");
      const entries: [keyof QueueFilters, string | undefined][] = [
        ["status", patch.status],
        ["q", patch.q],
        ["verif", patch.verif],
        ["sort", patch.sort],
      ];
      for (const [k, v] of entries) {
        if (v === undefined) continue;
        if (!v || v === DEFAULTS[k]) next.delete(k);
        else next.set(k, v);
      }
      const s = next.toString();
      return `/owner/${slug}/applications${s ? `?${s}` : ""}`;
    },
    [sp, slug],
  );

  const [draft, setDraft] = React.useState(filters.q);
  React.useEffect(() => setDraft(filters.q), [filters.q]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildHref({ q: draft }));
  }

  const verifLabel =
    VERIF_OPTIONS.find((o) => o.key === filters.verif)?.label ?? "All verifications";
  const sortLabel =
    filters.sort === "newest" ? "Sort: Newest first" : "Sort: Oldest first";

  return (
    <div className="queue-head">
      <nav className="queue-tabs" aria-label="Queue tabs">
        {STATUS_TABS.map((tab) => {
          const active = filters.status === tab.key;
          const count =
            tab.key === "PENDING"
              ? counts.pending
              : tab.key === "APPROVED"
                ? counts.approved
                : tab.key === "REJECTED"
                  ? counts.rejected
                  : counts.all;
          return (
            <Link
              key={tab.key}
              href={buildHref({ status: tab.key })}
              className={active ? "on" : undefined}
              data-active={active ? "true" : "false"}
              data-testid={`apps-tab-${tab.key}`}
            >
              {tab.label}
              {tab.key === "PENDING" && count > 0 ? (
                <span className="qt-count">{count}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="queue-filters">
        <form className="search-field" onSubmit={submitSearch}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search applicants, answers…"
            aria-label="Search applications"
            data-testid="apps-search"
          />
        </form>

        <FilterPopover
          label={verifLabel}
          testId="apps-filter-verif"
          options={VERIF_OPTIONS}
          selected={filters.verif}
          onSelect={(v) => router.push(buildHref({ verif: v }))}
          testIdFor={(v) => `apps-verif-${v}`}
        />

        <FilterPopover
          label={sortLabel}
          testId="apps-filter-sort"
          options={SORT_OPTIONS}
          selected={filters.sort}
          onSelect={(v) => router.push(buildHref({ sort: v }))}
          testIdFor={(v) => `apps-sort-${v}`}
        />
      </div>
    </div>
  );
}

function FilterPopover<T extends string>({
  label,
  testId,
  options,
  selected,
  onSelect,
  testIdFor,
}: {
  label: string;
  testId: string;
  options: { key: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
  testIdFor: (v: T) => string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className="filter-chip" data-testid={testId}>
          {label}
          {caret()}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="filter-menu"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              className={o.key === selected ? "filter-menu-item on" : "filter-menu-item"}
              onClick={() => {
                onSelect(o.key);
                setOpen(false);
              }}
              data-testid={testIdFor(o.key)}
            >
              {o.label}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { verifyProviders } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

type AppRow = {
  id: string;
  createdAt: string;
  userName: string;
  userImage: string | null;
  verifiedProviders: string[];
  excerpt?: string | null;
  subtitle?: string | null;
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, oklch(0.65 0.15 260), oklch(0.45 0.12 260))",
  "linear-gradient(135deg, oklch(0.62 0.16 30),  oklch(0.42 0.13 30))",
  "linear-gradient(135deg, oklch(0.55 0.14 155), oklch(0.35 0.10 155))",
  "linear-gradient(135deg, oklch(0.58 0.13 80),  oklch(0.38 0.10 80))",
  "linear-gradient(135deg, oklch(0.60 0.14 320), oklch(0.40 0.11 320))",
  "linear-gradient(135deg, oklch(0.55 0.14 200), oklch(0.35 0.10 200))",
  "linear-gradient(135deg, oklch(0.55 0.14 40),  oklch(0.35 0.10 40))",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function ApplicationsList({
  slug,
  rows,
  selectedId,
  totalRequiredVerifications,
}: {
  slug: string;
  rows: AppRow[];
  selectedId?: string;
  totalRequiredVerifications: number;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulk, setBulk] = React.useState<null | "APPROVE" | "REJECT">(null);
  const [note, setNote] = React.useState("");
  const [reason, setReason] = React.useState("Insufficient verification");
  const [busy, setBusy] = React.useState(false);

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };
  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(rows.map((r) => r.id)) : new Set());
  };

  async function submitBulk() {
    if (!bulk) return;
    setBusy(true);
    try {
      for (const id of selectedIds) {
        await fetch(`/api/applications/${id}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            decision: bulk,
            note: note || undefined,
            rejectionReason: bulk === "REJECT" ? reason : undefined,
          }),
        });
      }
      setSelectedIds(new Set());
      setBulk(null);
      setNote("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="q-list">
        <div className="q-list-head">
          <label>
            <input type="checkbox" disabled /> Select all
          </label>
          <span className="sort">Sort: Oldest</span>
        </div>
        <div className="empty-state">Queue is clear. No pending applications.</div>
      </div>
    );
  }

  return (
    <div className="q-list" data-testid="applications-list">
      <div className="q-list-head">
        <label>
          <input
            type="checkbox"
            checked={selectedIds.size === rows.length}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
        </label>
        <span className="sort">
          Sort: Oldest
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div
          style={{
            padding: "10px 14px",
            background: "var(--ink)",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <span style={{ fontWeight: 600 }}>{selectedIds.size} selected</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setBulk("APPROVE")}
              style={{
                padding: "5px 10px",
                borderRadius: 5,
                fontSize: 11.5,
                fontWeight: 500,
                background: "var(--success)",
                color: "#fff",
              }}
              data-testid="apps-bulk-approve"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => setBulk("REJECT")}
              style={{
                padding: "5px 10px",
                borderRadius: 5,
                fontSize: 11.5,
                fontWeight: 500,
                background: "oklch(0.32 0.08 25)",
                color: "#fff",
              }}
              data-testid="apps-bulk-reject"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {rows.map((r, i) => {
        const active = r.id === selectedId;
        const gradient = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
        const verifiedCount = r.verifiedProviders.length;
        const hasAll = verifiedCount >= totalRequiredVerifications && totalRequiredVerifications > 0;
        return (
          <Link
            key={r.id}
            href={`/owner/${slug}/applications/${r.id}`}
            scroll={false}
            className={active ? "q-item selected" : "q-item"}
            data-testid={`app-row-${r.id}`}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(r.id)}
              onChange={(e) => {
                e.stopPropagation();
                toggle(r.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              data-testid={`app-select-${r.id}`}
              aria-label={`Select ${r.userName}`}
            />
            <div className="qi-av" style={{ background: gradient }}>
              {r.userImage ? <img src={r.userImage} alt="" /> : initials(r.userName)}
            </div>
            <div className="qi-body">
              <div className="qi-name">
                <span className="qi-name-text">{r.userName}</span>
                <span className="qi-time">{timeAgo(r.createdAt)}</span>
              </div>
              {r.excerpt && <div className="qi-excerpt">{r.excerpt}</div>}
              <div className="qi-badges">
                <span className={hasAll ? "verif-pill ok" : "verif-pill missing"}>
                  {hasAll ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                  )}
                  {verifiedCount}
                  {totalRequiredVerifications > 0 ? `/${totalRequiredVerifications}` : ""} verified
                </span>
                {r.subtitle && <span className="verif-pill">{r.subtitle}</span>}
              </div>
            </div>
          </Link>
        );
      })}

      {/* Bulk dialog */}
      {bulk !== null && (
        <div
          onClick={() => setBulk(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "oklch(0.2 0.02 240 / 0.35)",
            zIndex: 50,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: 24,
              maxWidth: 460,
              width: "100%",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
              {bulk === "APPROVE" ? "Approve selected" : "Reject selected"}
            </h2>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
              Apply this decision to <b>{selectedIds.size}</b> application
              {selectedIds.size === 1 ? "" : "s"}.
            </div>
            {bulk === "REJECT" && (
              <div style={{ marginBottom: 12 }}>
                <label className="label">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="select-trigger"
                  data-testid="app-rejection-reason"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label">Note (optional)</label>
              <textarea
                className="textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Visible to the applicant"
                data-testid="app-note"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setBulk(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={bulk === "REJECT" ? "btn btn-no" : "btn btn-ok"}
                onClick={submitBulk}
                disabled={busy}
                data-testid="app-confirm"
                style={{ opacity: busy ? 0.5 : 1 }}
              >
                {busy ? "Working…" : bulk === "APPROVE" ? "Approve all" : "Reject all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const REJECTION_REASONS = [
  "Insufficient verification",
  "Does not meet criteria",
  "Duplicate account",
  "Other",
];

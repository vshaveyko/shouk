import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { OwnerShell } from "@/components/owner/OwnerShell";

export const dynamic = "force-dynamic";

const applicationsCss = `
.apps-body { padding: 28px 32px; min-width: 0; min-height: 100%; }
.apps-body .page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; }
.apps-body .page-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; line-height: 1.05; letter-spacing: -0.01em; }
.apps-body .page-head .lead { font-size: 13px; color: var(--muted); margin-top: 6px; max-width: 560px; }

.apps-body .queue-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
.apps-body .queue-tabs { display: flex; gap: 2px; background: var(--bg-soft); border: 1px solid var(--line); border-radius: 8px; padding: 3px; }
.apps-body .queue-tabs a { padding: 6px 12px; border-radius: 5px; font-size: 12.5px; color: var(--muted); font-weight: 500; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
.apps-body .queue-tabs a .qt-count { font-size: 10.5px; font-weight: 700; padding: 1px 6px; border-radius: 999px; background: var(--ink); color: #fff; }
.apps-body .queue-tabs a.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px oklch(0 0 0 / 0.06); }

.apps-body .queue-filters { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.apps-body .filter-chip { padding: 5px 11px; border-radius: 7px; font-size: 12px; font-weight: 500; color: var(--ink-soft); background: #fff; border: 1px solid var(--line); display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; cursor: pointer; }
.apps-body .filter-chip:hover { background: var(--hover); }
.apps-body .filter-chip svg { width: 11px; height: 11px; color: var(--muted); }
.apps-body .search-field { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 7px; background: #fff; border: 1px solid var(--line); min-width: 220px; }
.apps-body .search-field svg { width: 12px; height: 12px; color: var(--muted); }
.apps-body .search-field input { border: 0; outline: 0; flex: 1; font-size: 12px; background: transparent; color: var(--ink); }
.apps-body .search-field input::placeholder { color: var(--muted); }

.apps-body .queue-split { display: grid; grid-template-columns: 380px minmax(0, 1fr); background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; min-height: 640px; }
@media (max-width: 900px) { .apps-body .queue-split { grid-template-columns: 1fr; } }

.apps-body .q-list { border-right: 1px solid var(--line); display: flex; flex-direction: column; min-width: 0; }
.apps-body .q-list-head { padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line-soft); background: var(--bg-soft); }
.apps-body .q-list-head label { display: inline-flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--muted); font-weight: 500; }
.apps-body .q-list-head input[type="checkbox"] { width: 14px; height: 14px; accent-color: var(--blue); }
.apps-body .q-list-head .sort { font-size: 11.5px; color: var(--muted); display: inline-flex; align-items: center; gap: 4px; }
.apps-body .q-list-head .sort svg { width: 10px; height: 10px; }

.apps-body .q-item { padding: 14px 16px; border-bottom: 1px solid var(--line-soft); cursor: pointer; display: grid; grid-template-columns: 16px 36px 1fr; gap: 10px; align-items: flex-start; transition: background 0.12s; text-decoration: none; color: inherit; }
.apps-body .q-item:last-child { border-bottom: 0; }
.apps-body .q-item:hover { background: var(--bg-soft); }
.apps-body .q-item.selected { background: var(--blue-softer); border-left: 3px solid var(--blue); padding-left: 13px; }
.apps-body .q-item.selected:hover { background: var(--blue-softer); }
.apps-body .q-item input[type="checkbox"] { width: 14px; height: 14px; margin-top: 3px; accent-color: var(--blue); }
.apps-body .q-item .qi-av { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 12px; font-weight: 600; flex: none; overflow: hidden; }
.apps-body .q-item .qi-av img { width: 100%; height: 100%; object-fit: cover; }
.apps-body .q-item .qi-body { min-width: 0; }
.apps-body .q-item .qi-name { font-size: 13px; font-weight: 600; letter-spacing: -0.005em; display: flex; align-items: center; gap: 6px; }
.apps-body .q-item .qi-name-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
.apps-body .q-item .qi-time { font-size: 11px; color: var(--muted); margin-left: auto; white-space: nowrap; font-weight: 400; flex: none; }
.apps-body .q-item .qi-excerpt { font-size: 11.5px; color: var(--muted); margin-top: 4px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; }
.apps-body .q-item .qi-badges { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
.apps-body .verif-pill { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: var(--bg-soft); color: var(--muted); font-weight: 500; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
.apps-body .verif-pill.ok { background: var(--success-soft); color: var(--success); }
.apps-body .verif-pill.missing { background: var(--warn-soft); color: oklch(0.5 0.14 50); }
.apps-body .verif-pill svg { width: 8px; height: 8px; }

.apps-body .q-detail { padding: 26px 32px 28px; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.apps-body .qd-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 18px; }
.apps-body .qd-applicant { display: flex; gap: 14px; align-items: center; min-width: 0; }
.apps-body .qd-applicant .av { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 18px; font-weight: 600; flex: none; overflow: hidden; }
.apps-body .qd-applicant .av img { width: 100%; height: 100%; object-fit: cover; }
.apps-body .qd-applicant h2 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 26px; line-height: 1.1; letter-spacing: -0.005em; margin-bottom: 2px; }
.apps-body .qd-applicant .qd-meta { font-size: 12px; color: var(--muted); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.apps-body .qd-applicant .qd-meta .dot { width: 2px; height: 2px; background: var(--muted); border-radius: 50%; }

.apps-body .qd-actions { display: flex; gap: 8px; flex-shrink: 0; }

.apps-body .qd-grid { display: grid; grid-template-columns: 1fr 300px; gap: 28px; min-height: 0; }
@media (max-width: 900px) { .apps-body .qd-grid { grid-template-columns: 1fr; } }
.apps-body .qd-answers { overflow: hidden; }
.apps-body .qd-sub { font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 12px; }
.apps-body .qd-answer { margin-bottom: 20px; }
.apps-body .qd-answer .q-q { font-size: 12.5px; color: var(--muted); margin-bottom: 6px; font-weight: 500; letter-spacing: -0.005em; }
.apps-body .qd-answer .q-a { font-size: 13.5px; color: var(--ink); line-height: 1.6; padding: 12px 14px; background: var(--bg-soft); border: 1px solid var(--line-soft); border-radius: 10px; }
.apps-body .qd-answer .q-a.chip { display: inline-block; background: var(--ink); color: #fff; border: 0; padding: 6px 12px; font-size: 12.5px; border-radius: 999px; font-weight: 500; }

.apps-body .qd-side { display: flex; flex-direction: column; gap: 16px; }
.apps-body .qd-panel { background: var(--bg-soft); border: 1px solid var(--line-soft); border-radius: 10px; padding: 14px; }
.apps-body .qd-panel h4 { font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 10px; }

.apps-body .verif-list { display: flex; flex-direction: column; gap: 7px; }
.apps-body .verif-item { display: flex; align-items: center; gap: 9px; font-size: 12.5px; }
.apps-body .verif-item .vi-ic { width: 18px; height: 18px; color: var(--ink-soft); flex: none; }
.apps-body .verif-item .vi-name { font-weight: 500; flex: 1; }
.apps-body .verif-item .vi-status { font-size: 10.5px; font-weight: 600; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; }
.apps-body .verif-item .vi-status svg { width: 9px; height: 9px; stroke-width: 3; }
.apps-body .verif-item .vi-status.ok { background: var(--success-soft); color: var(--success); }
.apps-body .verif-item .vi-status.missing { background: var(--warn-soft); color: oklch(0.48 0.15 50); }

.apps-body .decision-bar { margin-top: 22px; padding-top: 22px; border-top: 1px solid var(--line); display: flex; gap: 10px; align-items: center; }
.apps-body .decision-bar .spacer { flex: 1; }

.apps-body .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: all 120ms; text-decoration: none; }
.apps-body .btn-sm { height: 28px; padding: 0 10px; font-size: 12px; }
.apps-body .btn-outline { background: #fff; color: var(--ink); border-color: var(--line); }
.apps-body .btn-outline:hover { background: var(--hover); }
.apps-body .btn-dark { background: var(--ink); color: #fff; }
.apps-body .btn-dark:hover { background: oklch(0.26 0.025 240); }
.apps-body .btn-ok { background: var(--success); color: #fff; }
.apps-body .btn-no { background: var(--danger); color: #fff; }
.apps-body .btn svg { width: 14px; height: 14px; stroke-width: 2; }

.apps-body .empty-state { padding: 80px 24px; text-align: center; color: var(--muted); font-size: 13px; }
`;

export default async function ApplicationsLayout({
  params,
  children,
}: {
  params: { slug: string };
  children: React.ReactNode;
}) {
  const { marketplace } = await requireOwnerOf(params.slug);

  const [pendingCount, approvedCount, rejectedCount, pendingOver48h] =
    await Promise.all([
      prisma.application.count({
        where: { marketplaceId: marketplace.id, status: "PENDING" },
      }),
      prisma.application.count({
        where: { marketplaceId: marketplace.id, status: "APPROVED" },
      }),
      prisma.application.count({
        where: { marketplaceId: marketplace.id, status: "REJECTED" },
      }),
      prisma.application.count({
        where: {
          marketplaceId: marketplace.id,
          status: "PENDING",
          createdAt: { lte: new Date(Date.now() - 48 * 3600 * 1000) },
        },
      }),
    ]);

  return (
    <OwnerShell slug={params.slug}>
      <style dangerouslySetInnerHTML={{ __html: applicationsCss }} />
      <main className="apps-body">
        <div className="page-head">
          <div>
            <h1>Applications</h1>
            <div className="lead">
              {pendingCount} pending
              {pendingOver48h > 0 ? ` · ${pendingOver48h} waiting over 48h` : ""}.
              Owners typically approve <b style={{ color: "var(--ink)" }}>~70%</b> of
              qualified applicants.
            </div>
          </div>
        </div>

        <div className="queue-head">
          <nav className="queue-tabs" aria-label="Queue tabs">
            <a className="on" href="#pending">
              Pending
              {pendingCount > 0 && <span className="qt-count">{pendingCount}</span>}
            </a>
            <a href="#approved">
              Approved{approvedCount > 0 ? ` (${approvedCount})` : ""}
            </a>
            <a href="#rejected">
              Rejected{rejectedCount > 0 ? ` (${rejectedCount})` : ""}
            </a>
            <a href="#all">All</a>
          </nav>
          <div className="queue-filters">
            <div className="search-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input placeholder="Search applicants, answers…" disabled />
            </div>
            <button type="button" className="filter-chip">
              All verifications
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button type="button" className="filter-chip">
              Sort: Oldest first
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="queue-split">{children}</div>
      </main>
    </OwnerShell>
  );
}

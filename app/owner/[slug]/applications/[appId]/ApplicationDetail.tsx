import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { timeAgo, verifyProviders } from "@/lib/utils";
import { ApplicationActions } from "./ApplicationActions";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export async function ApplicationDetail({
  slug,
  appId,
}: {
  slug: string;
  appId: string;
}) {
  const app = await prisma.application.findUnique({
    where: { id: appId },
    include: {
      marketplace: {
        include: { applicationQuestions: { orderBy: { order: "asc" } } },
      },
      user: {
        include: {
          verifiedAccounts: true,
          memberships: {
            where: { status: "ACTIVE" },
            include: {
              marketplace: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!app || app.marketplace.slug !== slug) notFound();

  const user = app.user;
  const answers = (app.answers ?? {}) as Record<string, unknown>;
  const displayName = user.displayName ?? user.name ?? user.email ?? "Applicant";
  const required = app.marketplace.requiredVerifications;
  const verifiedSet = new Set(user.verifiedAccounts.map((v) => v.provider));

  const accountAgeDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000),
  );
  const emailDomain = user.email?.split("@")[1] ?? null;

  const gradient = "linear-gradient(135deg, oklch(0.65 0.15 260), oklch(0.45 0.12 260))";

  return (
    <>
      <div className="qd-head">
        <div className="qd-applicant">
          <div className="av" style={{ background: gradient }}>
            {user.image ? <img src={user.image} alt="" /> : initials(displayName)}
          </div>
          <div>
            <h2>{displayName}</h2>
            <div className="qd-meta">
              <span>Applied {timeAgo(app.createdAt)}</span>
              {user.email && (
                <>
                  <span className="dot"></span>
                  <span>{user.email}</span>
                </>
              )}
              <span className="dot"></span>
              <span>Account {accountAgeDays}d old</span>
            </div>
          </div>
        </div>
        <div className="qd-actions">
          <ApplicationActions appId={app.id} slug={slug} />
        </div>
      </div>

      <div className="qd-grid">
        <div className="qd-answers">
          <div className="qd-sub">
            Application answers ·{" "}
            {Object.keys(answers).length} of{" "}
            {app.marketplace.applicationQuestions.length}
          </div>
          {app.marketplace.applicationQuestions.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              No application questions configured.
            </div>
          ) : (
            app.marketplace.applicationQuestions.map((q) => {
              const val = answers[q.id] ?? answers[q.label] ?? null;
              const isShort =
                typeof val === "string" && val.length < 30 && !val.includes("\n");
              return (
                <div key={q.id} className="qd-answer">
                  <div className="q-q">{q.label}</div>
                  {val == null || val === "" ? (
                    <div className="q-a" style={{ color: "var(--muted)" }}>
                      —
                    </div>
                  ) : isShort ? (
                    <div className="q-a chip">{String(val)}</div>
                  ) : (
                    <div className="q-a">{renderAnswer(val)}</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <aside className="qd-side">
          <div className="qd-panel">
            <h4>Identity verification</h4>
            <div className="verif-list">
              {required.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  No providers required.
                </div>
              ) : (
                required.map((p) => {
                  const label =
                    verifyProviders.find((v) => v.id === p)?.label ?? p;
                  const ok = verifiedSet.has(p);
                  return (
                    <div key={p} className="verif-item">
                      <svg
                        className="vi-ic"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4l3 3" />
                      </svg>
                      <span className="vi-name">{label}</span>
                      <span className={ok ? "vi-status ok" : "vi-status missing"}>
                        {ok ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            Verified
                          </>
                        ) : (
                          <>Missing</>
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="qd-panel">
            <h4>Signals</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Email domain</span>
                <span style={{ fontWeight: 500 }}>{emailDomain ?? "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Account age</span>
                <span style={{ fontWeight: 500 }}>{accountAgeDays} days</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Verified accounts</span>
                <span style={{ fontWeight: 500 }}>{user.verifiedAccounts.length} linked</span>
              </div>
            </div>
          </div>

          {user.memberships.length > 0 && (
            <div className="qd-panel">
              <h4>Other marketplaces</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {user.memberships.map((m) => (
                  <Link
                    key={m.id}
                    href={`/m/${m.marketplace.slug}`}
                    style={{
                      fontSize: 11.5,
                      padding: "4px 9px",
                      borderRadius: 999,
                      background: "#fff",
                      border: "1px solid var(--line)",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {m.marketplace.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function renderAnswer(val: unknown): React.ReactNode {
  if (val == null || val === "") return <span style={{ color: "var(--muted)" }}>—</span>;
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

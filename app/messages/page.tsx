import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

// Ported verbatim from design Flow 6 screen 6E.
// All data stubbed — no messaging backend yet. TODO: wire to real threads.
const messagesCss = `
.msgs { display: grid; grid-template-columns: 360px 1fr; min-height: calc(100vh - 60px); background: #fff; }
@media (max-width: 900px) { .msgs { grid-template-columns: 1fr; } }
.msgs .msg-list { border-right: 1px solid var(--line); display: flex; flex-direction: column; min-height: 0; }
.msgs .msg-list-head { padding: 18px 18px 12px; border-bottom: 1px solid var(--line); }
.msgs .msg-list-head h2 { margin: 0; font-size: 17px; letter-spacing: -0.01em; font-weight: 600; }
.msgs .msg-list-head .filter-row { display: flex; gap: 6px; margin-top: 12px; }
.msgs .msg-list-head .f-chip { padding: 5px 10px; border-radius: 999px; font-size: 11.5px; background: var(--bg-soft); color: var(--ink-soft); border: 1px solid var(--line); cursor: pointer; }
.msgs .msg-list-head .f-chip.on { background: var(--ink); color: #fff; border-color: var(--ink); }
.msgs .msg-thread { display: flex; gap: 11px; padding: 12px 14px; border-bottom: 1px solid var(--line-soft); cursor: pointer; }
.msgs .msg-thread.on { background: var(--hover); }
.msgs .msg-thread:hover { background: var(--bg-soft); }
.msgs .msg-thumb { width: 42px; height: 42px; border-radius: 9px; flex: none; background: linear-gradient(135deg, oklch(0.5 0.18 25), oklch(0.25 0.08 25)); }
.msgs .msg-thumb.b { background: linear-gradient(135deg, oklch(0.55 0.12 80), oklch(0.3 0.06 60)); }
.msgs .msg-thumb.c { background: linear-gradient(135deg, oklch(0.35 0.04 240), oklch(0.18 0.02 240)); }
.msgs .msg-thumb.d { background: linear-gradient(135deg, oklch(0.55 0.1 195), oklch(0.3 0.08 200)); }
.msgs .msg-body { flex: 1; min-width: 0; }
.msgs .msg-body .mt-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.msgs .msg-body .mt-name { font-size: 13px; font-weight: 600; }
.msgs .msg-body .mt-time { font-size: 11px; color: var(--muted); }
.msgs .msg-body .mt-listing { font-size: 11.5px; color: var(--blue-ink); margin-top: 2px; }
.msgs .msg-body .mt-preview { font-size: 12.5px; color: var(--ink-soft); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msgs .msg-unread { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); margin-top: 6px; }

.msgs .msg-panel { display: flex; flex-direction: column; min-height: 0; }
.msgs .msg-panel-head { display: flex; align-items: center; padding: 14px 20px; gap: 14px; border-bottom: 1px solid var(--line); }
.msgs .msg-panel-head .pthumb { width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, oklch(0.5 0.18 25), oklch(0.25 0.08 25)); }
.msgs .msg-panel-head .ph-name { font-size: 14px; font-weight: 600; }
.msgs .msg-panel-head .ph-sub { font-size: 11.5px; color: var(--muted); }
.msgs .msg-panel-head .ph-listing { margin-left: auto; padding: 6px 11px; border-radius: 8px; background: var(--bg-soft); font-size: 12px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--line); }
.msgs .msg-panel-head .ph-listing .pr { font-weight: 600; }
.msgs .verified-chip { font-size: 10.5px; font-weight: 600; padding: 2px 7px; border-radius: 4px; background: var(--success-soft); color: var(--success); }

.msgs .msg-body-scroll { flex: 1; padding: 22px 24px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.msgs .daydiv { align-self: center; font-size: 11px; color: var(--muted); margin: 6px 0; }
.msgs .bubble { max-width: 64%; padding: 10px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.45; }
.msgs .bubble.me { align-self: flex-end; background: var(--ink); color: #fff; border-bottom-right-radius: 4px; }
.msgs .bubble.them { align-self: flex-start; background: var(--bg-soft); color: var(--ink); border: 1px solid var(--line); border-bottom-left-radius: 4px; }
.msgs .bubble .bt { font-size: 10.5px; opacity: 0.6; display: block; margin-top: 4px; }

.msgs .msg-compose { padding: 14px 20px; border-top: 1px solid var(--line); display: flex; gap: 10px; align-items: center; }
.msgs .msg-compose .msg-input { flex: 1; height: 42px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg-soft); padding: 0 14px; display: flex; align-items: center; font-size: 13.5px; color: var(--muted); }
.msgs .msg-compose .msg-send { width: 42px; height: 42px; border-radius: 10px; background: var(--ink); color: #fff; display: grid; place-items: center; border: 0; cursor: pointer; }
.msgs .msg-compose .msg-send svg { width: 16px; height: 16px; }

.msgs .msg-empty-state { padding: 60px 24px; text-align: center; color: var(--muted); font-size: 13px; display: flex; align-items: center; justify-content: center; height: 100%; }
`;

export default async function MessagesPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/messages");
  const { user, memberships, owned } = ctx;

  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{
          id: user.id,
          name: user.displayName ?? user.name,
          image: user.image,
          email: user.email,
        }}
        activeMarketplace={null}
        marketplaces={[...owned, ...memberships]}
        mode="member"
        notificationCount={unread}
      />
      <style dangerouslySetInnerHTML={{ __html: messagesCss }} />

      <div className="msgs">
        <div className="msg-list">
          <div className="msg-list-head">
            <h2>Messages</h2>
            <div className="filter-row">
              <button className="f-chip on">All</button>
              <button className="f-chip">Buying</button>
              <button className="f-chip">Selling</button>
              <button className="f-chip">Unread · 2</button>
            </div>
          </div>

          {/* STUB: static threads from design mock */}
          <div className="msg-thread on">
            <div className="msg-thumb"></div>
            <div className="msg-body">
              <div className="mt-top">
                <div className="mt-name">Marco C.</div>
                <div className="mt-time">8m</div>
              </div>
              <div className="mt-listing">1987 Testarossa · Ferrari Frenzy</div>
              <div className="mt-preview">
                Happy to share the Classiche file. What&apos;s your email?
              </div>
            </div>
            <div className="msg-unread"></div>
          </div>
          <div className="msg-thread">
            <div className="msg-thumb b"></div>
            <div className="msg-body">
              <div className="mt-top">
                <div className="mt-name">Aisha R.</div>
                <div className="mt-time">2h</div>
              </div>
              <div className="mt-listing">308 GTS · Ferrari Frenzy</div>
              <div className="mt-preview">
                Can do $70k firm if you can pick up this weekend.
              </div>
            </div>
            <div className="msg-unread"></div>
          </div>
          <div className="msg-thread">
            <div className="msg-thumb c"></div>
            <div className="msg-body">
              <div className="mt-top">
                <div className="mt-name">James L.</div>
                <div className="mt-time">Yesterday</div>
              </div>
              <div className="mt-listing">512 TR · Ferrari Frenzy</div>
              <div className="mt-preview">
                You: Thanks, let me know about the service history and I&apos;ll
                make…
              </div>
            </div>
          </div>
          <div className="msg-thread">
            <div className="msg-thumb d"></div>
            <div className="msg-body">
              <div className="mt-top">
                <div className="mt-name">Nadia V.</div>
                <div className="mt-time">2d</div>
              </div>
              <div className="mt-listing">Levi&apos;s Big E · Heritage Denim</div>
              <div className="mt-preview">
                Great, I&apos;ll ship Monday. Tracking to follow.
              </div>
            </div>
          </div>
        </div>

        <div className="msg-panel">
          <div className="msg-panel-head">
            <div className="pthumb"></div>
            <div>
              <div className="ph-name">
                Marco C.
                <span className="verified-chip" style={{ marginLeft: 6 }}>
                  ✓ Verified
                </span>
              </div>
              <div className="ph-sub">Ferrari Frenzy · online now</div>
            </div>
            <div className="ph-listing">
              <span>1987 Testarossa</span>
              <span className="pr">$184,000</span>
            </div>
          </div>
          <div className="msg-body-scroll">
            <div className="daydiv">Today</div>
            <div className="bubble them">
              Hi Jane — saw your bid. Happy to answer any questions. The major was
              done 3,200 miles ago by Algar. Full records included.
            </div>
            <div className="bubble me">
              Thanks Marco. Any underside photos? Also curious about the Classiche
              file timeline.
              <span className="bt">11:42 AM</span>
            </div>
            <div className="bubble them">
              Sending underside shots now — give me 5. File was approved Oct &apos;24,
              all matching numbers confirmed.
            </div>
            <div className="bubble them">
              Happy to share the Classiche file. What&apos;s your email?
              <span className="bt">11:51 AM</span>
            </div>
          </div>
          <div className="msg-compose">
            <div className="msg-input">Write a message…</div>
            <button type="button" className="msg-send" aria-label="Send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

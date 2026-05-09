import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SkelCircle, SrLoading } from "@/components/ui/Skeleton";

const css = `
.msgL { display: grid; grid-template-columns: 360px 1fr; min-height: calc(100vh - 60px); background: #fff; }
@media (max-width: 880px) { .msgL { grid-template-columns: 1fr; } .msgL .pane { display: none; } }
.msgL .list { border-right: 1px solid var(--line); padding: 14px 0; overflow: hidden; }
.msgL .list .hd { padding: 0 18px 14px; }
.msgL .list .row { display: flex; gap: 12px; padding: 12px 18px; align-items: center; border-bottom: 1px solid var(--line-soft); }
.msgL .pane { padding: 24px 32px; display: flex; flex-direction: column; gap: 14px; }
.msgL .pane .bubble { max-width: 60%; padding: 12px; border-radius: 12px; background: var(--bg-soft); border: 1px solid var(--line); }
`;

export default function MessagesLoading() {
  return (
    <div style={{ background: "var(--bg-soft)" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="msgL" data-testid="messages-skeleton">
        <SrLoading label="Loading messages…" />
        <div className="list" aria-hidden="true">
          <div className="hd">
            <Skel w={140} h={22} />
            <div style={{ height: 10 }} />
            <Skel w="100%" h={32} r={8} />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="row">
              <SkelCircle size={40} />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <Skel w="55%" h={12} />
                  <Skel w={36} h={10} />
                </div>
                <Skel w="80%" h={11} />
              </div>
            </div>
          ))}
        </div>
        <div className="pane" aria-hidden="true">
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--line-soft)" }}>
            <SkelCircle size={36} />
            <Skel w={160} h={14} />
          </div>
          <div className="bubble" style={{ alignSelf: "flex-start" }}><Skel w={180} h={11} /></div>
          <div className="bubble" style={{ alignSelf: "flex-end", background: "var(--blue-softer)", borderColor: "var(--blue-softer)" }}><Skel w={140} h={11} /></div>
          <div className="bubble" style={{ alignSelf: "flex-start" }}><Skel w={220} h={11} /></div>
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--line-soft)" }}>
            <Skel w="100%" h={44} r={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

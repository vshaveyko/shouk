import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.dashL { background: var(--bg-soft); min-height: 100vh; }
.dashL .strip { background: var(--bg-panel); border-bottom: 1px solid var(--line); padding: 28px 28px 22px; }
.dashL .strip-inner { max-width: 1440px; margin: 0 auto; }
.dashL .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
.dashL .head .actions { display: inline-flex; gap: 8px; }
.dashL .filter { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.dashL .mp-row { display: flex; gap: 10px; overflow: hidden; padding-bottom: 6px; }
.dashL .mp-chip { flex: none; width: 240px; height: 86px; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; display: flex; gap: 10px; align-items: center; }
.dashL .body { padding: 24px 28px 0; max-width: 1440px; margin: 0 auto; }
.dashL .two { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; }
@media (max-width: 1100px) { .dashL .two { grid-template-columns: minmax(0, 1fr) 260px; } }
@media (max-width: 960px)  { .dashL .two { grid-template-columns: 1fr; } }
.dashL .feed-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 14px; gap: 16px; }
.dashL .feed-item { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: flex; gap: 14px; margin-bottom: 10px; }
.dashL .side-stack { display: flex; flex-direction: column; gap: 14px; }
.dashL .side-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; position: relative; overflow: hidden; }
.dashL .side-card::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--ink); }
.dashL .side-card.saved::before { background: var(--blue); }
.dashL .mine-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; padding: 10px; background: var(--bg-soft); border-radius: 8px; margin-bottom: 10px; }
.dashL .mine-stats > div { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.dashL .mine-row { display: flex; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line-soft); align-items: center; }
.dashL .mine-row:first-of-type { border-top: 0; padding-top: 4px; }
`;

function FeedItemSkel() {
  return (
    <div className="feed-item">
      <Skel w={90} h={90} r={10} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8 }}>
        <div>
          <Skel w={110} h={10} />
          <div style={{ height: 8 }} />
          <Skel w="80%" h={14} />
          <div style={{ height: 6 }} />
          <Skel w="55%" h={14} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <Skel w={80} h={18} r={5} />
          <Skel w={70} h={11} />
        </div>
      </div>
    </div>
  );
}

function MarketplaceChipSkel() {
  return (
    <div className="mp-chip" aria-hidden="true">
      <Skel w={56} h={56} r={10} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <Skel w="80%" h={13} />
        <Skel w="60%" h={11} />
        <Skel w={48} h={14} r={4} />
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="dashL" data-testid="home-skeleton">
        <SrLoading label="Loading your dashboard…" />
        <div className="strip">
          <div className="strip-inner">
            <div className="head">
              <div>
                <Skel w={140} h={11} />
                <div style={{ height: 8 }} />
                <Skel w={260} h={32} />
              </div>
              <div className="actions">
                <Skel w={170} h={36} r={9} />
                <Skel w={180} h={36} r={9} />
              </div>
            </div>
            <div className="filter">
              <Skel w={360} h={36} r={9} />
              <Skel w={260} h={36} r={9} />
            </div>
            <div className="mp-row">
              {Array.from({ length: 4 }).map((_, i) => <MarketplaceChipSkel key={i} />)}
            </div>
          </div>
        </div>
        <div className="body">
          <div className="two">
            <div className="feed">
              <div className="feed-head">
                <Skel w={220} h={18} />
                <Skel w={210} h={28} r={8} />
              </div>
              {Array.from({ length: 5 }).map((_, i) => <FeedItemSkel key={i} />)}
            </div>
            <aside className="side-stack" aria-hidden="true">
              <div className="side-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <Skel w={110} h={12} />
                  <Skel w={60} h={11} />
                </div>
                <div className="mine-stats">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>
                      <Skel w={28} h={20} />
                      <Skel w={42} h={9} />
                    </div>
                  ))}
                </div>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="mine-row">
                    <Skel w={40} h={40} r={8} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                      <Skel w="85%" h={12} />
                      <Skel w="50%" h={10} />
                    </div>
                  </div>
                ))}
                <div style={{ height: 8 }} />
                <Skel w="100%" h={36} r={9} />
              </div>
              <div className="side-card saved">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <Skel w={120} h={12} />
                  <Skel w={50} h={11} />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="mine-row">
                    <Skel w={40} h={40} r={8} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                      <Skel w="80%" h={12} />
                      <Skel w="55%" h={10} />
                    </div>
                    <Skel w={48} h={12} />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

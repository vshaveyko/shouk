import { OwnerShellSkeleton } from "@/components/owner/OwnerShellSkeleton";
import { Skel, SkelCircle, SrLoading } from "@/components/ui/Skeleton";

const css = `
.dl { padding: 28px 32px; }
.dl .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; flex-wrap: wrap; }
.dl .metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 22px; }
@media (max-width: 1100px) { .dl .metrics { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 700px)  { .dl .metrics { grid-template-columns: repeat(2, 1fr); } }
.dl .metric { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; }
.dl .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 900px) { .dl .grid { grid-template-columns: 1fr; } }
.dl .panel { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.dl .panel-hd { padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line-soft); }
.dl .row { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--line-soft); }
.dl .row:last-child { border-bottom: 0; }
`;

function MetricSkel() {
  return (
    <div className="metric" aria-hidden="true">
      <Skel w={80} h={10} />
      <div style={{ height: 14 }} />
      <Skel w={64} h={32} />
      <div style={{ height: 8 }} />
      <Skel w={120} h={11} />
    </div>
  );
}

export default function OwnerDashboardLoading() {
  return (
    <OwnerShellSkeleton>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="dl" data-testid="owner-dashboard-skeleton">
        <SrLoading label="Loading dashboard…" />
        <div className="head">
          <div>
            <Skel w={280} h={32} />
            <div style={{ height: 8 }} />
            <Skel w={400} h={12} />
          </div>
          <div style={{ display: "inline-flex", gap: 8 }}>
            <Skel w={120} h={36} r={8} />
            <Skel w={130} h={36} r={8} />
          </div>
        </div>
        <div className="metrics">
          {Array.from({ length: 5 }).map((_, i) => <MetricSkel key={i} />)}
        </div>
        <div className="grid">
          <div className="panel" aria-hidden="true">
            <div className="panel-hd">
              <Skel w={140} h={13} />
              <Skel w={56} h={11} />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="row">
                <SkelCircle size={36} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                  <Skel w="55%" h={12} />
                  <Skel w="40%" h={10} />
                </div>
                <Skel w={42} h={11} />
              </div>
            ))}
          </div>
          <div className="panel" aria-hidden="true">
            <div className="panel-hd">
              <Skel w={120} h={13} />
              <Skel w={56} h={11} />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="row">
                <Skel w={26} h={26} r={999} />
                <Skel w="60%" h={12} />
                <Skel w={36} h={10} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </OwnerShellSkeleton>
  );
}

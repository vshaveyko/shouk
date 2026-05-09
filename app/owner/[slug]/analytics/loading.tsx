import { OwnerShellSkeleton } from "@/components/owner/OwnerShellSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.an { padding: 28px 32px; }
.an .hd { margin-bottom: 18px; }
.an .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
@media (max-width: 900px) { .an .kpis { grid-template-columns: repeat(2, 1fr); } }
.an .kpi { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; }
.an .charts { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
@media (max-width: 900px) { .an .charts { grid-template-columns: 1fr; } }
.an .chart { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
`;

export default function AnalyticsLoading() {
  return (
    <OwnerShellSkeleton>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="an" data-testid="analytics-skeleton">
        <SrLoading label="Loading analytics…" />
        <div className="hd">
          <Skel w={180} h={28} />
          <div style={{ height: 6 }} />
          <Skel w={320} h={12} />
        </div>
        <div className="kpis" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi">
              <Skel w={90} h={10} />
              <div style={{ height: 12 }} />
              <Skel w={90} h={28} />
              <div style={{ height: 6 }} />
              <Skel w={130} h={11} />
            </div>
          ))}
        </div>
        <div className="charts" aria-hidden="true">
          <div className="chart">
            <Skel w={140} h={14} />
            <div style={{ height: 18 }} />
            <Skel w="100%" h={240} r={8} />
          </div>
          <div className="chart">
            <Skel w={120} h={14} />
            <div style={{ height: 18 }} />
            <Skel w="100%" h={240} r={8} />
          </div>
        </div>
      </div>
    </OwnerShellSkeleton>
  );
}

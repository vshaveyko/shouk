import { OwnerShellSkeleton } from "@/components/owner/OwnerShellSkeleton";
import { Skel, SkelCircle, SrLoading } from "@/components/ui/Skeleton";

const css = `
.al { padding: 28px 32px; }
.al .hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; gap: 16px; flex-wrap: wrap; }
.al .filters { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.al .table { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.al .row { display: grid; grid-template-columns: 36px 1fr 140px 120px 100px 32px; gap: 14px; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--line-soft); }
.al .row:last-child { border-bottom: 0; }
@media (max-width: 880px) { .al .row { grid-template-columns: 36px 1fr 100px; } .al .row > :nth-child(n+4) { display: none; } }
`;

export default function ApplicationsLoading() {
  return (
    <OwnerShellSkeleton>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="al" data-testid="applications-skeleton">
        <SrLoading label="Loading applications…" />
        <div className="hd">
          <div>
            <Skel w={220} h={28} />
            <div style={{ height: 6 }} />
            <Skel w={320} h={12} />
          </div>
          <Skel w={130} h={36} r={8} />
        </div>
        <div className="filters">
          <Skel w={92} h={32} r={8} />
          <Skel w={82} h={32} r={8} />
          <Skel w={86} h={32} r={8} />
          <Skel w={88} h={32} r={8} />
        </div>
        <div className="table" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="row">
              <SkelCircle size={36} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skel w="60%" h={13} />
                <Skel w="40%" h={11} />
              </div>
              <Skel w={120} h={12} />
              <Skel w={90} h={20} r={6} />
              <Skel w={64} h={11} />
              <Skel w={20} h={20} r={4} />
            </div>
          ))}
        </div>
      </div>
    </OwnerShellSkeleton>
  );
}

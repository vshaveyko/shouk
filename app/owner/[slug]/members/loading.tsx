import { OwnerShellSkeleton } from "@/components/owner/OwnerShellSkeleton";
import { Skel, SkelCircle, SrLoading } from "@/components/ui/Skeleton";

const css = `
.ml { padding: 28px 32px; }
.ml .hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; gap: 16px; flex-wrap: wrap; }
.ml .filters { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.ml .table { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.ml .row { display: grid; grid-template-columns: 36px 1fr 120px 110px 90px; gap: 14px; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--line-soft); }
.ml .row:last-child { border-bottom: 0; }
@media (max-width: 720px) { .ml .row { grid-template-columns: 36px 1fr 90px; } .ml .row > :nth-child(n+4) { display: none; } }
`;

export default function MembersLoading() {
  return (
    <OwnerShellSkeleton>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ml" data-testid="members-skeleton">
        <SrLoading label="Loading members…" />
        <div className="hd">
          <div>
            <Skel w={140} h={28} />
            <div style={{ height: 6 }} />
            <Skel w={300} h={12} />
          </div>
          <Skel w={120} h={36} r={8} />
        </div>
        <div className="filters">
          <Skel w={86} h={32} r={8} />
          <Skel w={84} h={32} r={8} />
          <Skel w={92} h={32} r={8} />
        </div>
        <div className="table" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="row">
              <SkelCircle size={36} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skel w="55%" h={13} />
                <Skel w="40%" h={11} />
              </div>
              <Skel w={100} h={20} r={6} />
              <Skel w={80} h={11} />
              <Skel w={60} h={11} />
            </div>
          ))}
        </div>
      </div>
    </OwnerShellSkeleton>
  );
}

import { OwnerShellSkeleton } from "@/components/owner/OwnerShellSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.pl { padding: 28px 32px; }
.pl .hd { margin-bottom: 18px; }
.pl .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
@media (max-width: 720px) { .pl .summary { grid-template-columns: 1fr; } }
.pl .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
.pl .table { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.pl .row { display: grid; grid-template-columns: 1fr 130px 110px 90px 28px; gap: 14px; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--line-soft); }
.pl .row:last-child { border-bottom: 0; }
`;

export default function PayoutsLoading() {
  return (
    <OwnerShellSkeleton>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="pl" data-testid="payouts-skeleton">
        <SrLoading label="Loading payouts…" />
        <div className="hd">
          <Skel w={140} h={28} />
          <div style={{ height: 6 }} />
          <Skel w={280} h={12} />
        </div>
        <div className="summary" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <Skel w={90} h={10} />
              <div style={{ height: 10 }} />
              <Skel w={120} h={28} />
              <div style={{ height: 6 }} />
              <Skel w={140} h={11} />
            </div>
          ))}
        </div>
        <div className="table" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="row">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skel w="55%" h={12} />
                <Skel w="35%" h={10} />
              </div>
              <Skel w={100} h={11} />
              <Skel w={80} h={20} r={6} />
              <Skel w={60} h={12} />
              <Skel w={20} h={20} r={4} />
            </div>
          ))}
        </div>
      </div>
    </OwnerShellSkeleton>
  );
}

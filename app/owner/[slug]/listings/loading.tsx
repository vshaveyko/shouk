import { OwnerShellSkeleton } from "@/components/owner/OwnerShellSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.ll { padding: 28px 32px; }
.ll .hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; gap: 16px; flex-wrap: wrap; }
.ll .filters { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.ll .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.ll .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.ll .card .body { padding: 12px; }
`;

export default function ListingsLoading() {
  return (
    <OwnerShellSkeleton>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ll" data-testid="listings-skeleton">
        <SrLoading label="Loading listings…" />
        <div className="hd">
          <div>
            <Skel w={180} h={28} />
            <div style={{ height: 6 }} />
            <Skel w={300} h={12} />
          </div>
          <Skel w={140} h={36} r={8} />
        </div>
        <div className="filters">
          <Skel w={84} h={32} r={8} />
          <Skel w={92} h={32} r={8} />
          <Skel w={78} h={32} r={8} />
        </div>
        <div className="grid" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card">
              <Skel w="100%" h={140} r={0} />
              <div className="body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skel w="80%" h={14} />
                <Skel w="50%" h={12} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Skel w={64} h={16} />
                  <Skel w={50} h={18} r={6} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OwnerShellSkeleton>
  );
}

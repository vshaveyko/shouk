import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.mpL .hero { background: var(--bg-panel); border-bottom: 1px solid var(--line); padding: 28px 28px 22px; }
.mpL .hero-inner { max-width: 1280px; margin: 0 auto; display: flex; gap: 16px; align-items: center; }
.mpL .body { max-width: 1280px; margin: 0 auto; padding: 24px 28px; }
.mpL .filters { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
.mpL .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.mpL .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.mpL .card .body2 { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
`;

export default function MarketplaceLoading() {
  return (
    <div className="mpL" style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div data-testid="marketplace-skeleton">
        <SrLoading label="Loading marketplace…" />
        <div className="hero" aria-hidden="true">
          <div className="hero-inner">
            <Skel w={72} h={72} r={12} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <Skel w={260} h={32} />
              <Skel w={400} h={12} />
              <div style={{ display: "inline-flex", gap: 8 }}>
                <Skel w={70} h={20} r={6} />
                <Skel w={90} h={20} r={6} />
              </div>
            </div>
            <Skel w={130} h={36} r={9} />
          </div>
        </div>
        <div className="body">
          <div className="filters" aria-hidden="true">
            {[80, 90, 76, 86, 96].map((w, i) => (
              <Skel key={i} w={w} h={32} r={8} />
            ))}
          </div>
          <div className="grid" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card">
                <Skel w="100%" h={150} r={0} />
                <div className="body2">
                  <Skel w="80%" h={13} />
                  <Skel w="50%" h={11} />
                  <Skel w={70} h={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

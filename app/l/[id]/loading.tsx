import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SkelCircle, SrLoading } from "@/components/ui/Skeleton";

const css = `
.listL { max-width: 1180px; margin: 0 auto; padding: 28px 24px; display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 28px; }
@media (max-width: 880px) { .listL { grid-template-columns: 1fr; } }
.listL .gallery { display: flex; flex-direction: column; gap: 10px; }
.listL .thumbs { display: flex; gap: 8px; }
.listL .thumbs .t { flex: 1; }
.listL .panel { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
.listL .seller { display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid var(--line-soft); }
`;

export default function ListingLoading() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="listL" data-testid="listing-skeleton">
        <SrLoading label="Loading listing…" />
        <div className="gallery" aria-hidden="true">
          <Skel w="100%" h={420} r={14} />
          <div className="thumbs">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skel key={i} className="t" h={80} r={10} />
            ))}
          </div>
        </div>
        <div className="panel" aria-hidden="true">
          <Skel w={120} h={11} />
          <Skel w="80%" h={28} />
          <Skel w={140} h={36} />
          <div style={{ display: "flex", gap: 8 }}>
            <Skel w={140} h={42} r={10} />
            <Skel w={42} h={42} r={10} />
          </div>
          <Skel w="100%" h={11} />
          <Skel w="90%" h={11} />
          <Skel w="70%" h={11} />
          <div className="seller">
            <SkelCircle size={42} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <Skel w="50%" h={12} />
              <Skel w="35%" h={10} />
            </div>
            <Skel w={86} h={28} r={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

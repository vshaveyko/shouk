import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.expL { max-width: 1280px; margin: 0 auto; padding: 28px 24px; }
.expL .hero { background: linear-gradient(180deg, var(--blue-softer) 0%, transparent 100%); border: 1px solid var(--line); border-radius: 14px; padding: 30px; margin-bottom: 24px; }
.expL .filters { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
.expL .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.expL .card { background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.expL .card .body { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
`;

export default function ExploreLoading() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="expL" data-testid="explore-skeleton">
        <SrLoading label="Loading marketplaces…" />
        <div className="hero" aria-hidden="true">
          <Skel w={280} h={36} />
          <div style={{ height: 8 }} />
          <Skel w={420} h={13} />
          <div style={{ height: 16 }} />
          <Skel w={460} h={42} r={10} />
        </div>
        <div className="filters" aria-hidden="true">
          {[80, 96, 70, 88, 92, 74].map((w, i) => (
            <Skel key={i} w={w} h={32} r={8} />
          ))}
        </div>
        <div className="grid" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card">
              <Skel w="100%" h={140} r={0} />
              <div className="body">
                <Skel w="60%" h={16} />
                <Skel w="80%" h={11} />
                <Skel w="50%" h={11} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Skel w={90} h={11} />
                  <Skel w={70} h={28} r={8} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.srchL { max-width: 1080px; margin: 0 auto; padding: 28px 24px; }
.srchL .bar { display: flex; gap: 8px; margin-bottom: 18px; }
.srchL .filters { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
.srchL .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.srchL .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.srchL .card .body { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
`;

export default function SearchLoading() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="srchL" data-testid="search-skeleton">
        <SrLoading label="Searching…" />
        <div className="bar" aria-hidden="true">
          <Skel w="100%" h={42} r={10} />
          <Skel w={86} h={42} r={10} />
        </div>
        <div className="filters" aria-hidden="true">
          {[80, 96, 76, 70, 92].map((w, i) => (
            <Skel key={i} w={w} h={28} r={8} />
          ))}
        </div>
        <div className="grid" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card">
              <Skel w="100%" h={150} r={0} />
              <div className="body">
                <Skel w="80%" h={13} />
                <Skel w="50%" h={11} />
                <Skel w={70} h={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

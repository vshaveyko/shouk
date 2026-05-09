import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.savL { max-width: 1100px; margin: 0 auto; padding: 28px 24px; }
.savL .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.savL .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.savL .card .body { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
`;

export default function SavedLoading() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="savL" data-testid="saved-skeleton">
        <SrLoading label="Loading saved listings…" />
        <Skel w={180} h={30} />
        <div style={{ height: 18 }} />
        <div className="grid" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
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

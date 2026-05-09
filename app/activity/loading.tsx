import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.actL { max-width: 1080px; margin: 0 auto; padding: 28px 24px; }
.actL .tabs { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
.actL .row { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
`;

export default function ActivityLoading() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="actL" data-testid="activity-skeleton">
        <SrLoading label="Loading activity…" />
        <Skel w={160} h={30} />
        <div style={{ height: 6 }} />
        <Skel w={280} h={12} />
        <div style={{ height: 18 }} />
        <div className="tabs" aria-hidden="true">
          {[78, 90, 70, 84].map((w, i) => (
            <Skel key={i} w={w} h={32} r={8} />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="row" aria-hidden="true">
            <Skel w={56} h={56} r={10} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <Skel w="60%" h={13} />
              <Skel w="40%" h={11} />
            </div>
            <Skel w={80} h={20} r={6} />
            <Skel w={70} h={11} />
          </div>
        ))}
      </div>
    </div>
  );
}

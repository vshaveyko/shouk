import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.notL { max-width: 720px; margin: 0 auto; padding: 28px 24px; }
.notL .row { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; display: flex; gap: 14px; margin-bottom: 10px; align-items: flex-start; }
`;

export default function NotificationsLoading() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="notL" data-testid="notifications-skeleton">
        <SrLoading label="Loading notifications…" />
        <Skel w={180} h={30} />
        <div style={{ height: 6 }} />
        <Skel w={300} h={12} />
        <div style={{ height: 18 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="row" aria-hidden="true">
            <Skel w={36} h={36} r={999} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <Skel w="80%" h={12} />
              <Skel w="55%" h={10} />
            </div>
            <Skel w={50} h={11} />
          </div>
        ))}
      </div>
    </div>
  );
}

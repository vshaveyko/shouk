import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SkelCircle, SrLoading } from "@/components/ui/Skeleton";

const css = `
.profL { max-width: 960px; margin: 0 auto; padding: 28px 24px; }
.profL .head { display: flex; gap: 18px; align-items: center; margin-bottom: 22px; }
.profL .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 720px) { .profL .grid { grid-template-columns: 1fr; } }
.profL .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
`;

export default function ProfileLoading() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="profL" data-testid="profile-skeleton">
        <SrLoading label="Loading profile…" />
        <div className="head">
          <SkelCircle size={84} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skel w={220} h={28} />
            <Skel w={180} h={12} />
            <div style={{ display: "inline-flex", gap: 8 }}>
              <Skel w={84} h={22} r={6} />
              <Skel w={70} h={22} r={6} />
            </div>
          </div>
        </div>
        <div className="grid" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <Skel w={120} h={13} />
              <div style={{ height: 12 }} />
              <Skel w="100%" h={11} />
              <div style={{ height: 6 }} />
              <Skel w="80%" h={11} />
              <div style={{ height: 6 }} />
              <Skel w="60%" h={11} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SkelCircle, SrLoading } from "@/components/ui/Skeleton";

const css = `
.userL { max-width: 1080px; margin: 0 auto; padding: 28px 24px; }
.userL .head { display: flex; gap: 18px; align-items: center; margin-bottom: 22px; }
.userL .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.userL .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.userL .card .body { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
`;

export default function UserProfileLoading() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="userL" data-testid="user-profile-skeleton">
        <SrLoading label="Loading profile…" />
        <div className="head" aria-hidden="true">
          <SkelCircle size={84} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skel w={220} h={28} />
            <Skel w={180} h={12} />
            <div style={{ display: "inline-flex", gap: 8 }}>
              <Skel w={70} h={20} r={6} />
              <Skel w={90} h={20} r={6} />
            </div>
          </div>
        </div>
        <Skel w={160} h={18} />
        <div style={{ height: 14 }} />
        <div className="grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
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

import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.setL { max-width: 760px; margin: 0 auto; padding: 28px 24px; }
.setL .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 22px; margin-bottom: 14px; }
.setL .field { margin-bottom: 14px; }
`;

export default function SettingsLoading() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <NavbarSkeleton mode="member" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="setL" data-testid="settings-skeleton">
        <SrLoading label="Loading settings…" />
        <Skel w={140} h={30} />
        <div style={{ height: 18 }} />
        {Array.from({ length: 2 }).map((_, c) => (
          <div key={c} className="card" aria-hidden="true">
            <Skel w={130} h={14} />
            <div style={{ height: 14 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="field">
                <Skel w={110} h={11} />
                <div style={{ height: 6 }} />
                <Skel w="100%" h={38} r={9} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

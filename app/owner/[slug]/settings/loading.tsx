import { OwnerShellSkeleton } from "@/components/owner/OwnerShellSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.sl { padding: 28px 32px; }
.sl .hd { margin-bottom: 18px; }
.sl .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--line); margin-bottom: 22px; padding-bottom: 10px; flex-wrap: wrap; }
.sl .form { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 22px; max-width: 760px; }
.sl .field { margin-bottom: 16px; }
`;

export default function SettingsLoading() {
  return (
    <OwnerShellSkeleton>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="sl" data-testid="owner-settings-skeleton">
        <SrLoading label="Loading settings…" />
        <div className="hd">
          <Skel w={140} h={28} />
          <div style={{ height: 6 }} />
          <Skel w={300} h={12} />
        </div>
        <div className="tabs" aria-hidden="true">
          {[78, 84, 70, 96, 60, 72, 64].map((w, i) => (
            <Skel key={i} w={w} h={28} r={8} />
          ))}
        </div>
        <div className="form" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="field">
              <Skel w={120} h={11} />
              <div style={{ height: 8 }} />
              <Skel w="100%" h={38} r={9} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Skel w={120} h={36} r={9} />
            <Skel w={92} h={36} r={9} />
          </div>
        </div>
      </div>
    </OwnerShellSkeleton>
  );
}

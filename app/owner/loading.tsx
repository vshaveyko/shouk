import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";
import { Skel, SrLoading } from "@/components/ui/Skeleton";

/**
 * Fallback for /owner/* routes that don't have a more-specific loading.tsx
 * (e.g. /owner/create wizard). Owner [slug]/* pages override this with
 * shell-aware skeletons.
 */
const css = `
.owl { max-width: 720px; margin: 0 auto; padding: 60px 24px; }
.owl .card { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 28px; }
.owl .field { margin-bottom: 18px; }
`;

export default function OwnerSegmentLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-soft)" }}>
      <NavbarSkeleton mode="owner" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="owl" data-testid="owner-create-skeleton">
        <SrLoading label="Loading…" />
        <Skel w={260} h={32} />
        <div style={{ height: 8 }} />
        <Skel w={420} h={12} />
        <div style={{ height: 24 }} />
        <div className="card" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
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
    </div>
  );
}

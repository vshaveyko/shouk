import { Skel } from "@/components/ui/Skeleton";
import { NavbarSkeleton } from "@/components/app/NavbarSkeleton";

/**
 * Mirror of OwnerShell layout (top bar + 232px sidebar + content) for
 * use in /owner/[slug]/* loading.tsx fallbacks.
 */
const css = `
.os-skel { display: flex; flex: 1; min-height: 0; }
.os-skel .sb { width: 232px; flex: none; border-right: 1px solid var(--line); background: #fff; padding: 22px 14px; }
.os-skel .sb .sb-eyebrow { padding: 0 10px 8px; }
.os-skel .sb .sb-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; margin-bottom: 2px; border-radius: 8px; }
@media (max-width: 640px) { .os-skel .sb { display: none; } }
.os-skel .body { flex: 1; min-width: 0; }
`;

export function OwnerShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-soft)" }}>
      <NavbarSkeleton mode="owner" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="os-skel" data-testid="owner-shell-skeleton">
        <aside className="sb" aria-hidden="true">
          <div className="sb-eyebrow"><Skel w={70} h={10} /></div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`m-${i}`} className="sb-row">
              <Skel w={15} h={15} r={4} />
              <Skel w={90} h={12} />
            </div>
          ))}
          <div style={{ height: 1, background: "var(--line)", margin: "10px 6px" }} />
          <div className="sb-eyebrow"><Skel w={86} h={10} /></div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`s-${i}`} className="sb-row">
              <Skel w={15} h={15} r={4} />
              <Skel w={70} h={12} />
            </div>
          ))}
        </aside>
        <div className="body">{children}</div>
      </div>
    </div>
  );
}

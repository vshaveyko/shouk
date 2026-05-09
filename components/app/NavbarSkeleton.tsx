import { Skel, SkelCircle } from "@/components/ui/Skeleton";

/**
 * Static placeholder for the sticky top navbar. Used by route-level
 * loading.tsx fallbacks so the page header doesn't pop in when an async
 * server page is suspended. Mirrors `.shouks-navbar` from `Navbar.tsx`
 * (60px height, 24px padding, sticky).
 */
const css = `
.nav-skel { height: 60px; background: #fff; border-bottom: 1px solid var(--line); display: flex; align-items: center; padding: 0 24px; gap: 20px; position: sticky; top: 0; z-index: 40; }
.nav-skel .brand { display: inline-flex; align-items: center; gap: 8px; }
.nav-skel .ns-spacer { flex: 1; }
.nav-skel .ns-row { display: inline-flex; align-items: center; gap: 12px; }
@media (max-width: 720px) {
  .nav-skel .ns-search { display: none; }
}
`;

export function NavbarSkeleton({ mode = "member" }: { mode?: "member" | "owner" }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <header className="nav-skel" aria-hidden="true" data-testid="navbar-skeleton">
        <div className="brand">
          <Skel w={24} h={24} r={6} />
          <Skel w={70} h={14} />
        </div>
        {mode === "member" ? (
          <div className="ns-row" style={{ marginLeft: 16 }}>
            <Skel w={56} h={14} />
            <Skel w={66} h={14} />
            <Skel w={50} h={14} />
          </div>
        ) : null}
        <div className="ns-spacer" />
        <Skel className="ns-search" w={300} h={36} r={9} />
        <div className="ns-row">
          <Skel w={36} h={36} r={9} />
          <Skel w={36} h={36} r={9} />
          <SkelCircle size={32} />
        </div>
      </header>
    </>
  );
}

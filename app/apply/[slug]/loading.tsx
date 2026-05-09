import { Skel, SrLoading } from "@/components/ui/Skeleton";

const css = `
.applyL { max-width: 430px; margin: 0 auto; padding: 24px 16px; min-height: 100vh; background: #fff; }
.applyL .hero { background: var(--bg-panel); border-radius: 14px; padding: 22px; margin-bottom: 18px; }
.applyL .field { margin-bottom: 16px; }
`;

export default function ApplyLoading() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="applyL" data-testid="apply-skeleton">
        <SrLoading label="Loading application…" />
        <div className="hero" aria-hidden="true">
          <Skel w={64} h={64} r={12} />
          <div style={{ height: 12 }} />
          <Skel w="60%" h={22} />
          <div style={{ height: 6 }} />
          <Skel w="80%" h={11} />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="field" aria-hidden="true">
            <Skel w={140} h={11} />
            <div style={{ height: 8 }} />
            <Skel w="100%" h={42} r={10} />
          </div>
        ))}
        <div style={{ height: 8 }} />
        <Skel w="100%" h={44} r={10} />
      </div>
    </>
  );
}

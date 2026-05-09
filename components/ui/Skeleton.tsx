import type { CSSProperties } from "react";

type SkelProps = {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  className?: string;
  style?: CSSProperties;
};

function size(v: number | string | undefined) {
  if (v == null) return undefined;
  return typeof v === "number" ? `${v}px` : v;
}

export function Skel({ w, h, r, className = "", style }: SkelProps) {
  return (
    <div
      className={`skel ${className}`.trim()}
      aria-hidden="true"
      style={{
        width: size(w),
        height: size(h),
        borderRadius: size(r),
        ...style,
      }}
    />
  );
}

export function SkelCircle({ size: s = 36, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return <Skel w={s} h={s} r={999} className={`skel-circle ${className}`.trim()} style={style} />;
}

export function SkelText({
  lines = 1,
  width = "100%",
  lineHeight = 12,
  gap = 8,
  className = "",
}: {
  lines?: number;
  width?: number | string | (number | string)[];
  lineHeight?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => {
        const w = Array.isArray(width) ? width[i % width.length] : width;
        return <Skel key={i} h={lineHeight} w={w} />;
      })}
    </div>
  );
}

export function SrLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <span className="sr-only" role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
      {label}
    </span>
  );
}

import { cn } from "@/lib/utils";

export function ShouksMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 44 44"
      width={size}
      height={size}
      fill="none"
      className={cn("flex-none", className)}
      aria-hidden
    >
      <path
        d="M22 3 38.5 12.5v19L22 41 5.5 31.5v-19L22 3Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M22 22 L22 3 M22 22 L5.5 31.5 M22 22 L38.5 31.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M22 22 L22 10 M22 22 L32.4 28 M22 22 L11.6 28"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="22" cy="22" r="3.4" fill="var(--blue)" />
      <circle cx="22" cy="10" r="2.4" fill="currentColor" />
      <circle cx="32.4" cy="28" r="2.4" fill="currentColor" />
      <circle cx="11.6" cy="28" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function BrandLockup({
  href = "/",
  size = 28,
  className,
}: {
  href?: string;
  size?: number;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-[10px] font-semibold text-ink",
        className,
      )}
      style={{ fontSize: size * 0.65, letterSpacing: "-0.02em" }}
    >
      <ShouksMark size={size} />
      <span>Shouks</span>
    </a>
  );
}

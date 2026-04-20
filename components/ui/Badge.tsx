import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium px-2 py-[2px] text-[12px] leading-[18px]",
  {
    variants: {
      variant: {
        neutral: "bg-bg-panel text-ink-soft",
        pending: "bg-warn-soft text-warn",
        approved: "bg-success-soft text-success",
        rejected: "bg-danger-soft text-danger",
        auction: "bg-blue-soft text-blue-ink",
        iso: "bg-amber-soft text-amber",
        blue: "bg-blue-soft text-blue-ink",
        outline: "border border-line text-ink-soft bg-transparent",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

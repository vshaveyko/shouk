import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 py-16 px-6",
        className,
      )}
    >
      {icon && (
        <div className="h-10 w-10 text-ink-soft flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-[16px] font-semibold">{title}</h3>
      {description && (
        <p className="text-[14px] text-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

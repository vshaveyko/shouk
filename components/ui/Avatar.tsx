"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, initialsOf } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = initialsOf(name);
  return (
    <AvatarPrimitive.Root
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-soft text-blue-ink font-semibold select-none flex-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.42) }}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={name ?? ""}
          className="h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback className="h-full w-full flex items-center justify-center">
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full h-[38px] px-3 rounded-[10px] border border-line bg-surface text-[14px] text-ink transition-all",
        "placeholder:text-muted",
        "focus-visible:outline-none focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-[var(--blue-softer)]",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full min-h-[96px] px-3 py-2.5 rounded-[10px] border border-line bg-surface text-[14px] text-ink transition-all",
      "placeholder:text-muted resize-y",
      "focus-visible:outline-none focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-[var(--blue-softer)]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  children,
  htmlFor,
  required,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block mb-1.5 text-[13px] font-medium text-ink-soft",
        className,
      )}
    >
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  );
}

export function Help({
  children,
  error,
  className,
}: {
  children: React.ReactNode;
  error?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-1 text-[12px]",
        error ? "text-danger" : "text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

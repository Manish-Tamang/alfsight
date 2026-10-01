import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
        variant === "primary" && "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        variant === "secondary" && "border border-[var(--color-border)] bg-white text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
        variant === "danger" && "border border-red-200 bg-white text-red-600 hover:bg-red-50",
        variant === "ghost" && "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

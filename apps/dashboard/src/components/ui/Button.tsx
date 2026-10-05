import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-pill)] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]",
  ghost:
    "bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
  danger:
    "bg-[var(--color-surface)] text-[var(--color-danger)] border border-[color:color-mix(in_oklab,var(--color-danger)_30%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--color-danger)_8%,transparent)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px]",
  md: "h-9 px-4 text-[13px]",
  lg: "h-11 px-5 text-[14px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  iconRight,
  children,
  className,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin-slow rounded-full border-[1.5px] border-current border-r-transparent" />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
}

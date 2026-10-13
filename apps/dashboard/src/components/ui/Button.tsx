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
  kbd?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap border-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-hover)] text-[var(--color-primary-foreground)] shadow-[inset_0_4px_3px_-2px_var(--color-primary-glow),0_4px_5px_-3px_rgba(0,0,0,0.6)] border-b-[2px] border-b-[var(--color-primary-deep)] hover:border-b-[4px] hover:border-b-[var(--color-primary-deep)] hover:-translate-y-px active:shadow-[inset_0_4px_3px_-2px_var(--color-primary-glow),0_4px_5px_-3px_transparent] active:border-b-[1px] active:border-b-[var(--color-primary-deep)] active:translate-y-0",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] shadow-[var(--shadow-card)]",
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
  kbd: kbdKey,
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
      {kbdKey && (
        <kbd className="ml-1 rounded bg-[var(--color-primary-light)] px-2 py-0.5 text-[11px] font-semibold shadow-[inset_0_-3px_3px_-2px_#1f54f0,inset_0_3px_3px_-2px_#658dff,0_2px_2px_-2px_rgba(0,0,0,0.3),0_0_0_2px_#0d47f0]">
          {kbdKey}
        </kbd>
      )}
      {iconRight}
    </button>
  );
}

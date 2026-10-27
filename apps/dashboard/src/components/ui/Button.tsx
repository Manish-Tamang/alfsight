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

// Dub-style buttons: flat fills, 1px border, soft ring on hover.
export const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none disabled:ring-0";

export const buttonVariants: Record<Variant, string> = {
  primary:
    "border-brand-600 bg-brand-500 text-white shadow-[var(--shadow-card)] hover:bg-brand-600 hover:ring-4 hover:ring-brand-100",
  secondary:
    "border-neutral-200 bg-white text-neutral-900 shadow-[var(--shadow-card)] hover:bg-neutral-50 hover:ring-4 hover:ring-neutral-100",
  ghost:
    "border-transparent bg-transparent text-neutral-600 hover:bg-black/5 hover:text-neutral-900",
  danger:
    "border-red-500 bg-red-500 text-white shadow-[var(--shadow-card)] hover:bg-red-600 hover:ring-4 hover:ring-red-100",
};

export const buttonSizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

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
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin-slow rounded-full border-[1.5px] border-current border-r-transparent" />
      ) : (
        icon
      )}
      {children}
      {kbdKey && <Kbd dark={variant === "primary"}>{kbdKey}</Kbd>}
      {iconRight}
    </button>
  );
}

export function Kbd({
  children,
  dark,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <kbd
      className={cn(
        "hidden rounded px-1.5 py-px font-mono text-[11px] font-medium md:inline-block",
        dark
          ? "bg-brand-600 text-white"
          : "border border-neutral-200 bg-neutral-100 text-neutral-500",
      )}
    >
      {children}
    </kbd>
  );
}

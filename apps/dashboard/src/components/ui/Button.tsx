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

// Studio-style buttons: glossy brand fill with an inset highlight ring.
export const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium transition-all cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-none disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none disabled:active:scale-100";

export const buttonVariants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-[inset_0_0_0_2px_var(--color-brand-600),inset_0_0_0_3px_rgb(255_255_255_/_0.3),inset_0_0_10px_rgb(255_255_255_/_0.2)] hover:shadow-[inset_0_0_0_2px_var(--color-brand-600),inset_0_0_0_3px_rgb(255_255_255_/_0.5),inset_0_0_20px_rgb(255_255_255_/_0.4)]",
  secondary:
    "bg-white text-neutral-900 shadow-[0_0_0_1px_rgb(0_0_0_/_0.08),0_1px_2px_rgb(0_0_0_/_0.05)] hover:bg-neutral-50",
  ghost:
    "bg-transparent text-neutral-600 hover:bg-black/5 hover:text-neutral-900",
  danger:
    "bg-gradient-to-b from-red-400 to-red-600 text-white shadow-[inset_0_0_0_2px_#dc2626,inset_0_0_0_3px_rgb(255_255_255_/_0.3),inset_0_0_10px_rgb(255_255_255_/_0.2)]",
};

export const buttonSizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
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
          ? "bg-white/20 text-white ring-1 ring-white/30"
          : "border border-neutral-200 bg-neutral-100 text-neutral-500",
      )}
    >
      {children}
    </kbd>
  );
}

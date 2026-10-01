import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Alert({
  children,
  tone = "success",
  onClose,
}: {
  children: ReactNode;
  tone?: "success" | "error" | "notice";
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start justify-between gap-3 rounded-[var(--radius)] border px-4 py-3 text-sm",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "error" && "border-red-200 bg-red-50 text-red-700",
        tone === "notice" && "border-amber-200 bg-amber-50 text-amber-900"
      )}
    >
      <span>{children}</span>
      {onClose && (
        <button
          aria-label="Dismiss"
          onClick={onClose}
          className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

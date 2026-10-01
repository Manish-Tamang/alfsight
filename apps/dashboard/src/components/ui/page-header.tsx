import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

import { useEffect, useState } from "react";
import { WidgetEditor } from "./WidgetEditor";

export function WidgetEditorRoute() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const value = url.searchParams.get("id");
    if (!value) {
      window.location.href = "/";
      return;
    }
    setId(value);
  }, []);

  if (!id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[13px] text-[var(--color-text-muted)]">
        Loading…
      </div>
    );
  }

  return <WidgetEditor feedId={id} />;
}

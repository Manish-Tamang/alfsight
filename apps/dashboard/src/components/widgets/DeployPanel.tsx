import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { getEmbedSnippet } from "@/lib/embed";
import { cn } from "@/lib/cn";

const steps = [
  "Save your widget so the latest layout and theme are stored.",
  "Copy the embed code below.",
  "Paste it into your page HTML where the feed should appear (typically before </body>).",
  "Set api-base to your live API URL when you deploy the backend.",
  "Serve the widget bundle from apps/widget (build output) at the script URL, or update the script src to your CDN.",
];

interface Props {
  feedId: string;
}

export function DeployPanel({ feedId }: Props) {
  const [copied, setCopied] = useState(false);
  const snippet = getEmbedSnippet(feedId);

  const copy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <ol className="space-y-3">
        {steps.map((text, i) => (
          <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[11px] font-semibold text-[var(--color-text)]">
              {i + 1}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-soft)]">
            Embed code
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre
          className={cn(
            "overflow-x-auto rounded-[8px] border border-[var(--color-border)] bg-[#1a1d1c] p-4",
            "text-[11.5px] leading-relaxed text-[#e8ebe9]",
          )}
        >
          <code>{snippet}</code>
        </pre>
      </div>
    </div>
  );
}

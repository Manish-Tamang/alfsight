import { useEffect, useRef, useState } from "react";
import type { FeedMeta } from "@instagram-widget/types";
import {
  Camera,
  Trash2,
  Plus,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@/lib/api";
import { getEmbedSnippet, WIDGET_ORIGIN } from "@/lib/embed";
import { cn } from "@/lib/cn";

const listWrap = "flex w-full flex-col gap-3";

const cardShell =
  "relative flex w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[color:color-mix(in_oklab,var(--color-primary)_25%,var(--color-border))]";

const actionBtn =
  "inline-flex h-8 items-center justify-center rounded-lg bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-hover)] px-4 text-[13px] font-semibold text-white shadow-[inset_0_4px_3px_-2px_var(--color-primary-glow),0_4px_5px_-3px_rgba(0,0,0,0.6)] border-b-[2px] border-b-[var(--color-primary-deep)] transition-all hover:border-b-[4px] hover:border-b-[var(--color-primary-deep)] hover:-translate-y-px active:shadow-[inset_0_4px_3px_-2px_var(--color-primary-glow),0_4px_5px_-3px_transparent] active:border-b-[1px] active:border-b-[var(--color-primary-deep)] active:translate-y-0";

const actionBtnSecondary =
  "inline-flex h-8 items-center justify-center rounded-lg bg-[var(--color-surface)] px-4 text-[13px] font-semibold text-[var(--color-text)] border border-[var(--color-border)] shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--color-surface-2)]";

function formatCreatedDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WidgetsGrid() {
  const [feeds, setFeeds] = useState<FeedMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listFeeds()
      .then(setFeeds)
      .catch((err: Error) => setError(err.message));
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this widget?")) return;
    await api.deleteFeed(id);
    setFeeds((prev) => prev?.filter((f) => f.id !== id) ?? null);
  };

  if (error) {
    return (
      <div className={cn(listWrap)}>
        <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[13px] text-[var(--color-danger)]">
          {error}
        </div>
      </div>
    );
  }

  if (feeds === null) {
    return (
      <div className={listWrap}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn(cardShell, "h-[120px] animate-pulse")} />
        ))}
      </div>
    );
  }

  if (feeds.length === 0) {
    return (
      <div className={listWrap}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={listWrap}>
      {feeds.map((feed) => (
        <WidgetCard key={feed.id} feed={feed} onDelete={() => remove(feed.id)} />
      ))}
    </div>
  );
}

function WidgetPreview({ feedId }: { feedId: string }) {
  return (
    <div className="relative flex h-full min-h-[120px] w-[168px] shrink-0 items-center justify-center overflow-hidden rounded-l-[10px] bg-[var(--color-surface-2)]">
      <iframe
        src={`${WIDGET_ORIGIN}/?feed=${feedId}`}
        title=""
        className="pointer-events-none absolute left-1/2 top-[58%] h-[240px] w-[360px] -translate-x-1/2 -translate-y-1/2 scale-[0.42] border-0"
        loading="lazy"
      />
    </div>
  );
}

function WidgetCard({ feed, onDelete }: { feed: FeedMeta; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const copyEmbed = () => {
    navigator.clipboard.writeText(getEmbedSnippet(feed.id));
    setInstalled(true);
    setTimeout(() => setInstalled(false), 2000);
  };

  const sync = async () => {
    setMenuOpen(false);
    try {
      setSyncing(true);
      await api.syncFeed(feed.id);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete();
  };

  return (
    <article className={cn(cardShell, "min-h-[120px]")}>
      <WidgetPreview feedId={feed.id} />

      <div className="relative flex min-w-0 flex-1 flex-col justify-center px-5 py-4 pr-11">
        <div className="absolute right-3 top-3 z-20" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="border-0 bg-transparent p-1 text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-text)]"
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={18} strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-30 mt-1 min-w-[148px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                disabled={syncing}
                onClick={() => void sync()}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  strokeWidth={1.75}
                  className={syncing ? "animate-spin-slow" : ""}
                />
                Sync posts
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <Trash2 size={14} strokeWidth={1.75} />
                Delete
              </button>
            </div>
          )}
        </div>

        <a
          href={`/widgets/edit?id=${feed.id}`}
          className="truncate text-[15px] font-semibold text-[var(--color-primary)] hover:underline"
        >
          {feed.name}
        </a>
        <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
          Created {formatCreatedDate(feed.createdAt)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a href={`/widgets/edit?id=${feed.id}`} className={actionBtn}>
            Edit
          </a>
          <button type="button" onClick={copyEmbed} className={actionBtnSecondary}>
            {installed ? "Copied" : "Install"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[10px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-primary)]">
        <Camera size={20} strokeWidth={1.75} />
      </div>
      <h3 className="text-[16px] font-semibold text-[var(--color-text)]">No widgets yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-muted)]">
        Create an Instagram feed widget and embed it anywhere with a single line of code.
      </p>
      <div className="mt-6">
        <a
          href="/widgets/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-hover)] px-5 text-[13px] font-semibold text-white shadow-[inset_0_4px_3px_-2px_var(--color-primary-glow),0_4px_5px_-3px_rgba(0,0,0,0.6)] border-b-[2px] border-b-[var(--color-primary-deep)] transition-all hover:border-b-[4px] hover:border-b-[var(--color-primary-deep)] hover:-translate-y-px"
        >
          <Plus size={14} />
          Create your first widget
        </a>
      </div>
    </div>
  );
}

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
  "relative flex w-full overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[color:color-mix(in_oklab,var(--color-primary)_25%,var(--color-border))]";

const actionBtn =
  "inline-flex h-8 items-center justify-center rounded-[6px] bg-[#eef0f2] px-4 text-[13px] font-medium text-[var(--color-text)] transition-colors hover:bg-[#e2e6ea]";

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

      <NewWidgetCard />
    </div>
  );
}

function WidgetPreview({ feedId }: { feedId: string }) {
  return (
    <div className="relative flex h-full min-h-[120px] w-[168px] shrink-0 items-center justify-center overflow-hidden bg-[#f0f2f5]">
      <iframe
        src={`${WIDGET_ORIGIN}/?feed=${feedId}`}
        title=""
        className="pointer-events-none absolute left-1/2 top-[58%] h-[240px] w-[360px] -translate-x-1/2 -translate-y-1/2 scale-[0.42] border-0"
        loading="lazy"
      />
    </div>
  );
}

function NewWidgetCard() {
  return (
    <a href="/widgets/new" className={cn(cardShell, "min-h-[120px]")}>
      <div className="flex h-full min-h-[120px] w-[168px] shrink-0 items-center justify-center bg-[#f0f2f5] text-[var(--color-text-muted)]">
        <Plus size={28} strokeWidth={1.5} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-4">
        <h3 className="text-[15px] font-semibold text-[var(--color-primary)]">New widget</h3>
        <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
          Instagram feed, grid, stories…
        </p>
        <div className="mt-3">
          <span className={actionBtn}>Create</span>
        </div>
      </div>
    </a>
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
        <div className="absolute right-3 top-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="border-0 bg-transparent p-1 text-[#9fa4aa] transition-colors hover:text-[var(--color-text)]"
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={18} strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-10 mt-1 min-w-[148px] overflow-hidden rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
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
          <button type="button" onClick={copyEmbed} className={actionBtn}>
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
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[8px] border border-[var(--color-border)] text-[var(--color-text)]">
        <Camera size={20} strokeWidth={1.75} />
      </div>
      <h3 className="text-[16px] font-semibold text-[var(--color-text)]">No widgets yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-muted)]">
        Create an Instagram feed widget and embed it anywhere with a single line of code.
      </p>
      <div className="mt-6">
        <a
          href="/widgets/new"
          className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[var(--color-primary)] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <Plus size={14} />
          Create your first widget
        </a>
      </div>
    </div>
  );
}

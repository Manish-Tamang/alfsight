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
import { getEmbedSnippet, getPreviewUrl } from "@/lib/embed";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/Button";

const listWrap = "flex w-full flex-col gap-3";

const cardShell =
  "relative flex w-full overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/5 ring-1 ring-black/5 transition-shadow hover:shadow-lg hover:shadow-black/5 hover:ring-brand-200";

const actionBtn = buttonClass("primary", "sm");

const actionBtnSecondary = buttonClass("secondary", "sm");

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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
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
    <div className="relative flex h-full min-h-[120px] w-[168px] shrink-0 items-center justify-center overflow-hidden border-r border-neutral-200/80 bg-neutral-50 hatch">
      <iframe
        src={getPreviewUrl(feedId)}
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
            className="rounded-md border-0 bg-transparent p-1 text-neutral-500 transition-colors hover:bg-black/5 hover:text-neutral-900"
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={18} strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-30 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 shadow-[var(--shadow-float)] animate-fade-in"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                disabled={syncing}
                onClick={() => void sync()}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
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
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 size={14} strokeWidth={1.75} />
                Delete
              </button>
            </div>
          )}
        </div>

        <a
          href={`/widgets/edit?id=${feed.id}`}
          className="truncate text-[15px] font-semibold text-neutral-900 hover:text-brand-700 hover:underline"
        >
          {feed.name}
        </a>
        <p className="mt-1 text-[13px] text-neutral-500">
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
    <div className="rounded-2xl bg-white px-4 py-16 text-center shadow-sm shadow-black/5 ring-1 ring-black/5">
      <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-[10px] bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.3),0_4px_10px_-4px_rgb(0_0_0_/_0.3)]">
        <Camera size={20} strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-neutral-900">No widgets yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-neutral-500">
        Create an Instagram feed widget and embed it anywhere with a single line of code.
      </p>
      <div className="mt-6">
        <a href="/widgets/new" className={buttonClass("primary", "md")}>
          <Plus size={14} />
          Create your first widget
        </a>
      </div>
    </div>
  );
}

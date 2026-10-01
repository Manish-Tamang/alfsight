import { useState, useEffect } from "react";
import type { FeedMeta, FeedSettings } from "@instagram-widget/types";
import {
  Check,
  Clipboard,
  Eye,
  Pencil,
  Grid2X2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Alert, Button, Card, PageHeader, inputClass, selectClass } from "@/components/ui";

interface InstagramAccount {
  id: string;
  instagramUserId: string;
  username: string;
  profilePictureUrl?: string | null;
}

export function FeedsPage() {
  const [feeds, setFeeds] = useState<FeedMeta[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedName, setFeedName] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [settings, setSettings] = useState<FeedSettings>({
    columns: 4,
    rows: 2,
    postCount: 8,
    order: "newest",
    gap: 16,
    borderRadius: 8,
    cardStyle: "clean",
    showCaption: true,
    hoverEffect: true,
    hoverStyle: "zoom",
  });

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewFeedId, setPreviewFeedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feedsRes, accountsRes] = await Promise.all([
        fetch("/api/feeds", { headers: { "x-dev-user-id": "dev-user-1" } }),
        fetch("/api/instagram/accounts", { headers: { "x-dev-user-id": "dev-user-1" } }),
      ]);

      if (feedsRes.ok) {
        const feedsData = await feedsRes.json();
        setFeeds(feedsData);
      }
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData);
        if (accountsData.length > 0) {
          setSelectedAccountId(accountsData[0].id);
        }
      }
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError("Failed to load feeds data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const isEditing = editingFeedId !== null;
      const res = await fetch(isEditing ? `/api/feeds/${editingFeedId}` : "/api/feeds", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-user-id": "dev-user-1",
        },
        body: JSON.stringify({
          name: feedName.trim(),
          instagramAccountId: selectedAccountId || undefined,
          settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create feed");
      }

      setFeeds((prev) => isEditing ? prev.map((feed) => feed.id === data.id ? data : feed) : [data, ...prev]);
      setIsModalOpen(false);
      setEditingFeedId(null);
      setFeedName("");
      setSuccess(isEditing ? `Feed "${data.name}" updated.` : `Feed "${data.name}" created and synced successfully!`);
    } catch (err: any) {
      console.error("Create feed error:", err);
      setError(err.message || "Failed to create feed");
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setEditingFeedId(null);
    setFeedName("");
    setSettings({ columns: 4, rows: 2, postCount: 8, order: "newest", gap: 16, borderRadius: 8, cardStyle: "clean", showCaption: true, hoverEffect: true, hoverStyle: "zoom" });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (feed: FeedMeta) => {
    setEditingFeedId(feed.id);
    setFeedName(feed.name);
    setSettings({
      columns: 4, rows: 2, postCount: 8, order: "newest", gap: 16, borderRadius: 8,
      cardStyle: "clean", showCaption: true, hoverEffect: true, hoverStyle: feed.settings.hoverStyle ?? (feed.settings.hoverEffect === false ? "none" : "zoom"),
      ...feed.settings,
    });
    setSelectedAccountId(feed.instagramAccountId ?? "");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSyncFeed = async (feedId: string) => {
    try {
      setSyncingId(feedId);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/feeds/${feedId}/refresh`, {
        method: "POST",
        headers: { "x-dev-user-id": "dev-user-1" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to sync feed");
      }

      setSuccess(`Synced ${data.syncedPosts ?? 0} posts from Instagram!`);
    } catch (err: any) {
      console.error("Sync error:", err);
      setError(err.message || "Failed to sync posts from Instagram");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm("Are you sure you want to delete this feed?")) return;

    try {
      const res = await fetch(`/api/feeds/${feedId}`, {
        method: "DELETE",
        headers: { "x-dev-user-id": "dev-user-1" },
      });

      if (res.ok) {
        setFeeds((prev) => prev.filter((f) => f.id !== feedId));
        if (previewFeedId === feedId) setPreviewFeedId(null);
        setSuccess("Feed deleted.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const copyEmbedCode = (feedId: string) => {
    const code = `<instagram-feed feed="${feedId}" api-base="https://localhost:8787"></instagram-feed>\n<script src="http://localhost:5174/src/index.ts" type="module"></script>`;
    navigator.clipboard.writeText(code);
    setCopiedId(feedId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div>
      <PageHeader
        title="Feeds & Widgets"
        description="Create, customize, and embed your Instagram feed widgets."
        action={
          <Button onClick={openCreateModal}>
            <Plus size={14} />
            Create feed
          </Button>
        }
      />

      {success && (
        <Alert onClose={() => setSuccess(null)}>{success}</Alert>
      )}

      {error && (
        <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {loading ? (
        <Card className="p-10 text-center text-sm text-[var(--color-muted-foreground)]">
          Loading feeds...
        </Card>
      ) : feeds.length > 0 ? (
        <div className="space-y-4">
          {feeds.map((feed) => {
            const connectedAccount = accounts.find(
              (a) => a.id === feed.instagramAccountId
            );

            return (
              <Card key={feed.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    {connectedAccount?.profilePictureUrl ? (
                      <img
                        src={connectedAccount.profilePictureUrl}
                        alt={connectedAccount.username}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-medium text-[var(--color-muted-foreground)]">
                        {feed.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-sm font-semibold text-[var(--color-foreground)]">
                          {feed.name}
                        </h2>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-[var(--radius)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                          {feed.id}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                        {connectedAccount ? `@${connectedAccount.username}` : "No account"}
                        {" · "}
                        {feed.settings.columns ?? 4} cols × {feed.settings.rows ?? 2} rows
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => openEditModal(feed)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-muted)] rounded-[var(--radius)] transition-colors cursor-pointer"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>

                    <button
                      onClick={() => handleSyncFeed(feed.id)}
                      disabled={syncingId === feed.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-muted)] rounded-[var(--radius)] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={syncingId === feed.id ? "animate-spin" : ""} />
                      {syncingId === feed.id ? "Syncing..." : "Sync"}
                    </button>

                    <button
                      onClick={() => setPreviewFeedId(previewFeedId === feed.id ? null : feed.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-muted)] rounded-[var(--radius)] transition-colors cursor-pointer"
                    >
                      <Eye size={12} />
                      {previewFeedId === feed.id ? "Hide" : "Preview"}
                    </button>

                    <button
                      onClick={() => copyEmbedCode(feed.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
                    >
                      {copiedId === feed.id ? <><Check size={12} />Copied</> : <><Clipboard size={12} />Embed</>}
                    </button>

                    <button
                      onClick={() => handleDeleteFeed(feed.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-[var(--radius)] transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-[var(--radius)] bg-zinc-900 px-3 py-2.5 font-mono text-xs text-zinc-300 overflow-x-auto">
                  <code>{`<instagram-feed feed="${feed.id}" api-base="https://localhost:8787"></instagram-feed>`}</code>
                  <button
                    onClick={() => copyEmbedCode(feed.id)}
                    className="ml-3 shrink-0 px-2 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 rounded-[var(--radius)] text-zinc-400 cursor-pointer"
                  >
                    {copiedId === feed.id ? "Copied" : "Copy"}
                  </button>
                </div>

                {previewFeedId === feed.id && (
                  <div className="mt-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                        Live Preview
                      </span>
                      <a
                        href={`http://localhost:5174/?feed=${feed.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--color-primary)] hover:underline"
                      >
                        Open in tab ↗
                      </a>
                    </div>
                    <div className="w-full rounded-[var(--radius)] bg-white p-3 min-h-[300px]">
                      <iframe
                        src={`http://localhost:5174/?feed=${feed.id}`}
                        className="w-full h-[480px] border-0 rounded-[var(--radius)]"
                        title={`Preview ${feed.name}`}
                      />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed p-14 text-center">
          <div className="text-[var(--color-muted-foreground)] max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-[var(--color-primary)] mx-auto mb-4 flex items-center justify-center">
              <Grid2X2 size={24} />
            </div>
            <h3 className="font-heading text-sm font-semibold text-[var(--color-foreground)] mb-1">
              No feeds created yet
            </h3>
            <p className="text-sm mb-5">
              Create your first Instagram feed widget to display your posts anywhere.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={14} />
              Create feed
            </Button>
          </div>
        </Card>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[var(--radius)] border border-[var(--color-border)] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-base font-semibold">{editingFeedId ? "Edit Feed" : "Create New Feed"}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-[var(--radius)] p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFeed} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                  Feed Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Homepage Instagram Gallery"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                  Instagram Account
                </label>
                {accounts.length > 0 ? (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className={selectClass}
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        @{acc.username}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-[var(--radius)] text-xs">
                    No Instagram accounts connected yet. Please connect one in the{" "}
                    <a href="/instagram" className="underline font-semibold">
                      Instagram tab
                    </a>{" "}
                    first.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                    Columns
                  </label>
                  <select
                    value={settings.columns}
                    onChange={(e) => setSettings({ ...settings, columns: Number(e.target.value) })}
                    className={selectClass}
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={6}>6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                    Rows
                  </label>
                  <select
                    value={settings.rows}
                    onChange={(e) => setSettings({ ...settings, rows: Number(e.target.value) })}
                    className={selectClass}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">Post Count</label>
                  <select value={settings.postCount} onChange={(e) => setSettings({ ...settings, postCount: Number(e.target.value) })} className={selectClass}>
                    {[4, 6, 8, 10, 12, 16, 20].map((count) => <option key={count} value={count}>{count} posts</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">Order</label>
                  <select value={settings.order} onChange={(e) => setSettings({ ...settings, order: e.target.value as FeedSettings["order"] })} className={selectClass}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                    Gap
                  </label>
                  <select
                    value={settings.gap}
                    onChange={(e) => setSettings({ ...settings, gap: Number(e.target.value) })}
                    className={selectClass}
                  >
                    <option value={8}>8px</option>
                    <option value={12}>12px</option>
                    <option value={16}>16px</option>
                    <option value={24}>24px</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                    Border Radius
                  </label>
                  <select
                    value={settings.borderRadius}
                    onChange={(e) => setSettings({ ...settings, borderRadius: Number(e.target.value) })}
                    className={selectClass}
                  >
                    <option value={0}>0px</option>
                    <option value={4}>4px</option>
                    <option value={8}>8px</option>
                    <option value={16}>16px</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">Card Style</label>
                  <select value={settings.cardStyle} onChange={(e) => setSettings({ ...settings, cardStyle: e.target.value as FeedSettings["cardStyle"] })} className={selectClass}>
                    <option value="clean">Clean</option>
                    <option value="rounded">Rounded</option>
                    <option value="elevated">Elevated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">Hover Style</label>
                  <select value={settings.hoverStyle} onChange={(e) => setSettings({ ...settings, hoverStyle: e.target.value as FeedSettings["hoverStyle"], hoverEffect: e.target.value !== "none" })} className={selectClass}>
                    <option value="zoom">Zoom image</option>
                    <option value="overlay">Caption overlay</option>
                    <option value="lift">Lift card</option>
                    <option value="none">No effect</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-5 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCaption}
                    onChange={(e) => setSettings({ ...settings, showCaption: e.target.checked })}
                    className="rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                  />
                  Show Captions
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !feedName.trim()} loading={creating}>
                  {creating ? (editingFeedId ? "Saving..." : "Creating...") : (editingFeedId ? "Save Changes" : "Create Feed")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

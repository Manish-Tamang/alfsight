import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedMeta, FeedSettings } from "@instagram-widget/types";
import {
  LayoutGrid,
  Sliders,
  Palette,
  ChevronLeft,
  Check,
  Code,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput, Toggle } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

type Tab = "layout" | "settings" | "theme";
type Device = "desktop" | "tablet" | "mobile";

interface Props {
  feedId: string;
}

const WIDGET_ORIGIN = "http://localhost:5174";

export function WidgetEditor({ feedId }: Props) {
  const [feed, setFeed] = useState<FeedMeta | null>(null);
  const [settings, setSettings] = useState<FeedSettings | null>(null);
  const [name, setName] = useState("");
  const [tab, setTab] = useState<Tab>("layout");
  const [device, setDevice] = useState<Device>("desktop");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    api
      .getFeed(feedId)
      .then((f) => {
        setFeed(f);
        setName(f.name);
        setSettings({
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
          ...f.settings,
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [feedId]);

  const update = <K extends keyof FeedSettings>(key: K, value: FeedSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
    setSaved(false);
  };

  const save = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await api.updateFeed(feedId, { name, settings });
      setFeed(updated);
      setDirty(false);
      setSaved(true);
      setIframeKey((k) => k + 1);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const copyEmbed = () => {
    const code = `<instagram-feed feed="${feedId}" api-base="https://localhost:8787"></instagram-feed>\n<script src="${WIDGET_ORIGIN}/src/index.ts" type="module"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const previewWidth = useMemo(() => {
    if (device === "mobile") return 390;
    if (device === "tablet") return 768;
    return "100%";
  }, [device]);

  const sendPreviewSettings = () => {
    if (!settings) return;

    const { postCount: _postCount, ...previewSettings } = settings;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "widget-preview-settings", settings: previewSettings },
      WIDGET_ORIGIN,
    );
  };

  useEffect(() => {
    sendPreviewSettings();
  }, [settings]);

  if (!feed || !settings) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-[var(--color-text-muted)]">
        {error ? <span className="text-[var(--color-danger)]">{error}</span> : "Loading editor…"}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </a>
          <div className="min-w-0">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
              className="w-full max-w-md border-0 bg-transparent text-[18px] font-semibold tracking-tight text-[var(--color-text)] outline-none focus:ring-0"
            />
            <p className="text-[12px] text-[var(--color-text-muted)]">
              @{settings.instagramHandle?.replace(/^@/, "") || "unlinked"} · widget {feed.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dirty && !saving && (
            <span className="text-[11.5px] text-[var(--color-text-soft)]">Unsaved changes</span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-[11.5px] text-[var(--color-primary)]">
              <Check size={12} /> Saved
            </span>
          )}
          <Button variant="secondary" size="sm" icon={<Code size={13} />} onClick={copyEmbed}>
            {copied ? "Copied" : "Embed"}
          </Button>
          <Button size="sm" loading={saving} disabled={!dirty && !saving} onClick={save}>
            Save
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[var(--radius-md)] bg-[color:color-mix(in_oklab,var(--color-danger)_8%,transparent)] px-3 py-2 text-[12.5px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="grid flex-1 gap-5 lg:grid-cols-[340px_1fr]">
        {/* Side panel */}
        <aside className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
          <div className="flex gap-1 border-b border-[var(--color-border-soft)] p-2">
            {([
              { id: "layout", label: "Layout", icon: LayoutGrid },
              { id: "settings", label: "Settings", icon: Sliders },
              { id: "theme", label: "Theme", icon: Palette },
            ] as const).map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] py-2 text-[12.5px] font-medium transition-colors",
                    active
                      ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                  )}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {tab === "layout" && <LayoutPanel settings={settings} update={update} />}
            {tab === "settings" && <SettingsPanel settings={settings} update={update} />}
            {tab === "theme" && <ThemePanel settings={settings} update={update} />}
          </div>
        </aside>

        {/* Preview */}
        <section className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-soft)] bg-[var(--color-surface-2)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-2.5">
            <span className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              Live preview
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                aria-label="Reload preview"
              >
                <RefreshCw size={12} />
              </button>
              <div className="mx-1 h-4 w-px bg-[var(--color-border)]" />
              {([
                { id: "desktop", icon: Monitor },
                { id: "tablet", icon: Tablet },
                { id: "mobile", icon: Smartphone },
              ] as const).map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDevice(d.id)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] transition-colors",
                      device === d.id
                        ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                    )}
                    aria-label={`${d.id} preview`}
                  >
                    <Icon size={13} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-1 items-start justify-center overflow-auto p-6">
            <div
              className="mx-auto overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]"
              style={{ width: previewWidth, maxWidth: "100%" }}
            >
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={`${WIDGET_ORIGIN}/?feed=${feedId}`}
                title="Widget preview"
                className="h-[640px] w-full border-0"
                onLoad={sendPreviewSettings}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function LayoutPanel({
  settings,
  update,
}: {
  settings: FeedSettings;
  update: <K extends keyof FeedSettings>(k: K, v: FeedSettings[K]) => void;
}) {
  const layouts: Array<{
    id: NonNullable<FeedSettings["layout"]>;
    label: string;
    description: string;
  }> = [
    { id: "showcase", label: "Showcase Carousel", description: "Large horizontal cards" },
    { id: "grid", label: "Grid", description: "Even square tiles" },
    { id: "masonry", label: "Masonry", description: "Staggered columns" },
  ];

  return (
    <div className="space-y-5">
      <Field label="Layout">
        <div className="grid grid-cols-3 gap-1.5">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => update("layout", layout.id)}
              className={cn(
                "flex min-h-[92px] flex-col items-stretch rounded-[var(--radius-md)] border p-2 text-left transition-colors",
                (settings.layout ?? "grid") === layout.id
                  ? "border-[var(--color-primary)] bg-[color:color-mix(in_oklab,var(--color-primary)_6%,transparent)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]",
              )}
            >
              <div className="mb-2 flex h-10 items-center justify-center overflow-hidden rounded-[4px] bg-[var(--color-surface-2)] p-1.5">
                {layout.id === "showcase" && (
                  <div className="flex w-full gap-1">
                    <span className="h-7 flex-[1.6] rounded-[2px] bg-[var(--color-primary)]" />
                    <span className="h-7 flex-1 rounded-[2px] bg-[var(--color-border)]" />
                    <span className="h-7 flex-1 rounded-[2px] bg-[var(--color-border)]" />
                  </div>
                )}
                {layout.id === "grid" && (
                  <div className="grid w-full grid-cols-3 gap-1">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <span key={index} className="aspect-square rounded-[2px] bg-[var(--color-primary)]" />
                    ))}
                  </div>
                )}
                {layout.id === "masonry" && (
                  <div className="flex w-full items-end gap-1">
                    <span className="h-6 flex-1 rounded-[2px] bg-[var(--color-primary)]" />
                    <span className="h-8 flex-1 rounded-[2px] bg-[var(--color-primary)]" />
                    <span className="h-5 flex-1 rounded-[2px] bg-[var(--color-primary)]" />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium leading-tight text-[var(--color-text)]">
                {layout.label}
              </span>
              <span className="mt-0.5 text-[10px] leading-tight text-[var(--color-text-soft)]">
                {layout.description}
              </span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Columns">
        <Select value={settings.columns} onChange={(e) => update("columns", Number(e.target.value))}>
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} columns
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Rows">
        <Select value={settings.rows} onChange={(e) => update("rows", Number(e.target.value))}>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} rows
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Post count">
        <Select
          value={settings.postCount}
          onChange={(e) => update("postCount", Number(e.target.value))}
        >
          {[4, 6, 8, 10, 12, 16, 20, 24].map((n) => (
            <option key={n} value={n}>
              {n} posts
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Gap" hint={`${settings.gap}px`}>
        <input
          type="range"
          min={0}
          max={32}
          step={2}
          value={settings.gap}
          onChange={(e) => update("gap", Number(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
      </Field>
    </div>
  );
}

function SettingsPanel({
  settings,
  update,
}: {
  settings: FeedSettings;
  update: <K extends keyof FeedSettings>(k: K, v: FeedSettings[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Camera username">
        <div className="flex h-10 items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="pl-3.5 pr-1 text-[13px] text-[var(--color-text-soft)]">@</span>
          <input
            value={(settings.instagramHandle ?? "").replace(/^@/, "")}
            onChange={(e) => update("instagramHandle", e.target.value)}
            placeholder="username"
            className="h-full flex-1 border-0 bg-transparent pr-3.5 text-[13px] outline-none"
          />
        </div>
      </Field>

      <Field label="Order">
        <Select
          value={settings.order}
          onChange={(e) => update("order", e.target.value as FeedSettings["order"])}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </Select>
      </Field>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface-2)] px-4">
        <Toggle
          label="Show captions"
          checked={!!settings.showCaption}
          onChange={(v) => update("showCaption", v)}
        />
        <div className="h-px bg-[var(--color-border-soft)]" />
        <Toggle
          label="Hover effects"
          checked={!!settings.hoverEffect}
          onChange={(v) => {
            update("hoverEffect", v);
            if (!v) update("hoverStyle", "none");
            else if (settings.hoverStyle === "none") update("hoverStyle", "zoom");
          }}
        />
      </div>

      <Field label="Header name">
        <TextInput
          value={settings.headerName ?? ""}
          onChange={(e) => update("headerName", e.target.value)}
          placeholder="Shown above the grid"
        />
      </Field>

      <Field label="Follow button text">
        <TextInput
          value={settings.followButtonText ?? ""}
          onChange={(e) => update("followButtonText", e.target.value)}
          placeholder="Follow on Camera"
        />
      </Field>
    </div>
  );
}

function ThemePanel({
  settings,
  update,
}: {
  settings: FeedSettings;
  update: <K extends keyof FeedSettings>(k: K, v: FeedSettings[K]) => void;
}) {
  const cardStyles: Array<{ id: FeedSettings["cardStyle"]; label: string }> = [
    { id: "clean", label: "Clean" },
    { id: "rounded", label: "Rounded" },
    { id: "elevated", label: "Elevated" },
  ];
  const hoverStyles: Array<{ id: FeedSettings["hoverStyle"]; label: string }> = [
    { id: "zoom", label: "Zoom" },
    { id: "overlay", label: "Overlay" },
    { id: "lift", label: "Lift" },
    { id: "none", label: "None" },
  ];

  return (
    <div className="space-y-5">
      <Field label="Card style">
        <div className="grid grid-cols-3 gap-1.5">
          {cardStyles.map((c) => (
            <button
              key={c.id}
              onClick={() => update("cardStyle", c.id)}
              className={cn(
                "rounded-[var(--radius-md)] border px-2 py-2 text-[12px] font-medium transition-colors",
                settings.cardStyle === c.id
                  ? "border-[var(--color-primary)] bg-[color:color-mix(in_oklab,var(--color-primary)_6%,transparent)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Border radius" hint={`${settings.borderRadius}px`}>
        <input
          type="range"
          min={0}
          max={24}
          step={2}
          value={settings.borderRadius}
          onChange={(e) => update("borderRadius", Number(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
      </Field>

      <Field label="Hover style">
        <div className="grid grid-cols-2 gap-1.5">
          {hoverStyles.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                update("hoverStyle", h.id);
                update("hoverEffect", h.id !== "none");
              }}
              className={cn(
                "rounded-[var(--radius-md)] border px-2 py-2 text-[12px] font-medium transition-colors",
                settings.hoverStyle === h.id
                  ? "border-[var(--color-primary)] bg-[color:color-mix(in_oklab,var(--color-primary)_6%,transparent)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

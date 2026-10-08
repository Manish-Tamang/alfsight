import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedMeta, FeedSettings } from "@instagram-widget/types";
import {
  LayoutGrid,
  Sliders,
  Palette,
  ChevronLeft,
  Check,
  Monitor,
  Smartphone,
  Tablet,
  Rocket,
} from "lucide-react";
import { api } from "@/lib/api";
import { WIDGET_ORIGIN } from "@/lib/embed";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput, Toggle } from "@/components/ui/Field";
import { DeployPanel } from "@/components/widgets/DeployPanel";
import { cn } from "@/lib/cn";

type Tab = "layout" | "settings" | "theme" | "deploy";
type Device = "desktop" | "tablet" | "mobile";

interface Props {
  feedId: string;
}

const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutGrid }> = [
  { id: "layout", label: "Layout", icon: LayoutGrid },
  { id: "settings", label: "Settings", icon: Sliders },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "deploy", label: "Deploy", icon: Rocket },
];

export function WidgetEditor({ feedId }: Props) {
  const [feed, setFeed] = useState<FeedMeta | null>(null);
  const [settings, setSettings] = useState<FeedSettings | null>(null);
  const [name, setName] = useState("");
  const [tab, setTab] = useState<Tab>("layout");
  const [device, setDevice] = useState<Device>("desktop");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
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
          layout: "grid",
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
      <div className="flex min-h-[50vh] items-center justify-center text-[13px] text-[var(--color-text-muted)]">
        {error ? <span className="text-[var(--color-danger)]">{error}</span> : "Loading…"}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1200px] flex-col">
      <div className="mb-4 flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <a
            href="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </a>
          <div className="min-w-0">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
              className="w-full min-w-0 border-0 bg-transparent text-[17px] font-semibold text-[var(--color-text)] outline-none"
            />
            <p className="truncate text-[12px] text-[var(--color-text-muted)]">
              @{settings.instagramHandle?.replace(/^@/, "") || "unlinked"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          {dirty && !saving && (
            <span className="text-[12px] text-[var(--color-text-soft)]">Unsaved</span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-[12px] text-[var(--color-primary)]">
              <Check size={14} /> Saved
            </span>
          )}
          <Button size="sm" loading={saving} disabled={!dirty && !saving} onClick={save}>
            Save
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[8px] border border-[color:color-mix(in_oklab,var(--color-danger)_35%,transparent)] bg-[color:color-mix(in_oklab,var(--color-danger)_8%,transparent)] px-3 py-2 text-[13px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="grid flex-1 gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="flex flex-col overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex border-b border-[var(--color-border)]">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                    active
                      ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                  )}
                >
                  <Icon size={15} strokeWidth={1.75} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-4">
            {tab === "layout" && <LayoutPanel settings={settings} update={update} />}
            {tab === "settings" && <SettingsPanel settings={settings} update={update} />}
            {tab === "theme" && <ThemePanel settings={settings} update={update} />}
            {tab === "deploy" && <DeployPanel feedId={feedId} />}
          </div>
        </aside>

        {tab === "deploy" ? (
          <section className="hidden rounded-[8px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] lg:flex lg:items-center lg:justify-center">
            <p className="max-w-sm px-6 text-center text-[13px] text-[var(--color-text-muted)]">
              Use the steps on the left to add this widget to your site. Switch to Layout, Settings, or Theme to
              preview changes live.
            </p>
          </section>
        ) : (
          <section className="flex flex-col overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2">
              <span className="text-[12px] font-medium text-[var(--color-text-muted)]">Preview</span>
              <div className="flex items-center gap-0.5">
                {(
                  [
                    { id: "desktop", icon: Monitor },
                    { id: "tablet", icon: Tablet },
                    { id: "mobile", icon: Smartphone },
                  ] as const
                ).map((d) => {
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDevice(d.id)}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-[4px]",
                        device === d.id
                          ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                          : "text-[var(--color-text-soft)] hover:text-[var(--color-text)]",
                      )}
                      aria-label={`${d.id} preview`}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-1 justify-center overflow-auto bg-[var(--color-surface-2)] p-4">
              <div
                className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white"
                style={{ width: previewWidth, maxWidth: "100%" }}
              >
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={`${WIDGET_ORIGIN}/?feed=${feedId}`}
                  title="Widget preview"
                  className="h-[min(640px,70vh)] w-full border-0"
                  onLoad={sendPreviewSettings}
                />
              </div>
            </div>
          </section>
        )}
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
  const layouts: Array<{ id: NonNullable<FeedSettings["layout"]>; label: string }> = [
    { id: "grid", label: "Grid" },
    { id: "showcase", label: "Showcase" },
    { id: "masonry", label: "Masonry" },
  ];

  return (
    <div className="space-y-4">
      <Field label="Layout type">
        <div className="grid grid-cols-3 gap-1.5">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => update("layout", layout.id)}
              className={cn(
                "rounded-[6px] border px-2 py-2 text-[12px] font-medium transition-colors",
                (settings.layout ?? "grid") === layout.id
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-soft)]",
              )}
            >
              {layout.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Columns">
          <Select value={settings.columns} onChange={(e) => update("columns", Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Rows">
          <Select value={settings.rows} onChange={(e) => update("rows", Number(e.target.value))}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Posts">
        <Select value={settings.postCount} onChange={(e) => update("postCount", Number(e.target.value))}>
          {[4, 6, 8, 12, 16, 20, 24].map((n) => (
            <option key={n} value={n}>
              {n}
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
    <div className="space-y-4">
      <Field label="Instagram username">
        <div className="flex h-10 items-center overflow-hidden rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="pl-3 pr-1 text-[13px] text-[var(--color-text-soft)]">@</span>
          <input
            value={(settings.instagramHandle ?? "").replace(/^@/, "")}
            onChange={(e) => update("instagramHandle", e.target.value)}
            placeholder="username"
            className="h-full flex-1 border-0 bg-transparent pr-3 text-[13px] outline-none"
          />
        </div>
      </Field>

      <Field label="Sort order">
        <Select
          value={settings.order}
          onChange={(e) => update("order", e.target.value as FeedSettings["order"])}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </Select>
      </Field>

      <Toggle
        label="Show captions"
        checked={!!settings.showCaption}
        onChange={(v) => update("showCaption", v)}
      />
      <Toggle
        label="Hover effects"
        checked={!!settings.hoverEffect}
        onChange={(v) => {
          update("hoverEffect", v);
          if (!v) update("hoverStyle", "none");
          else if (settings.hoverStyle === "none") update("hoverStyle", "zoom");
        }}
      />

      <Field label="Header title">
        <TextInput
          value={settings.headerName ?? ""}
          onChange={(e) => update("headerName", e.target.value)}
          placeholder="Optional"
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
    <div className="space-y-4">
      <Field label="Card style">
        <div className="grid grid-cols-3 gap-1.5">
          {cardStyles.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => update("cardStyle", c.id)}
              className={cn(
                "rounded-[6px] border py-2 text-[12px] font-medium transition-colors",
                settings.cardStyle === c.id
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)]",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Corner radius" hint={`${settings.borderRadius}px`}>
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

      <Field label="Hover">
        <div className="grid grid-cols-2 gap-1.5">
          {hoverStyles.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                update("hoverStyle", h.id);
                update("hoverEffect", h.id !== "none");
              }}
              className={cn(
                "rounded-[6px] border py-2 text-[12px] font-medium transition-colors",
                settings.hoverStyle === h.id
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)]",
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

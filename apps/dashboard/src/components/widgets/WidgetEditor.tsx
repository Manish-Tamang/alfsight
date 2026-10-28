import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedMeta, FeedSettings } from "@instagram-widget/types";
import {
  ChevronLeft,
  Check,
  Monitor,
  Smartphone,
  Tablet,
  Code,
  Copy,
} from "lucide-react";
import { api } from "@/lib/api";
import { WIDGET_ORIGIN, getEmbedSnippet, getPreviewUrl } from "@/lib/embed";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Tab = "design" | "deploy";
type Device = "desktop" | "tablet" | "mobile";

interface Props {
  feedId: string;
}

export function WidgetEditor({ feedId }: Props) {
  const [feed, setFeed] = useState<FeedMeta | null>(null);
  const [settings, setSettings] = useState<FeedSettings | null>(null);
  const [name, setName] = useState("");
  const [tab, setTab] = useState<Tab>("design");
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
    <div className="mx-auto flex h-[calc(100vh-5rem)] w-full max-w-[1200px] flex-col">
      {/* Top bar */}
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <a
            href="/"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </a>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            className="min-w-0 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 font-display text-lg font-medium text-neutral-900 outline-none transition-colors hover:border-neutral-200 focus:border-neutral-300 focus-visible:outline-none"
          />
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600">
            @{settings.instagramHandle?.replace(/^@/, "") || "unlinked"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check size={12} /> Saved
            </span>
          )}
          {dirty && !saving && !saved && (
            <span className="text-xs text-neutral-500">Unsaved changes</span>
          )}
          <Button size="sm" loading={saving} disabled={!dirty && !saving} onClick={save}>
            Save
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main area */}
      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden rounded-xl border border-neutral-200">
        {/* Preview */}
        <div className="flex flex-1 flex-col bg-neutral-50">
          <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-3 py-2">
            <span className="text-xs font-medium text-neutral-500">Preview</span>
            <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 p-0.5">
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
                      "flex size-6 items-center justify-center rounded-md transition-colors",
                      device === d.id
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-900",
                    )}
                    aria-label={`${d.id} preview`}
                  >
                    <Icon size={13} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-4">
            <div
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[var(--shadow-card)]"
              style={{ width: previewWidth, maxWidth: "100%" }}
            >
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={getPreviewUrl(feedId)}
                title="Widget preview"
                className="h-[min(640px,70vh)] w-full border-0"
                onLoad={sendPreviewSettings}
              />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex w-[300px] shrink-0 flex-col border-l border-neutral-200 bg-white">
          {/* Panel tabs */}
          <div className="flex gap-1 border-b border-neutral-200 px-3">
            {(
              [
                { id: "design", label: "Design" },
                { id: "deploy", label: "Deploy" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px border-b-2 px-2 py-2.5 text-sm font-medium transition-colors",
                  tab === t.id
                    ? "border-brand-500 text-brand-700"
                    : "border-transparent text-neutral-500 hover:text-neutral-900",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {tab === "design" ? (
              <DesignPanel settings={settings} update={update} />
            ) : (
              <DeployInlinePanel feedId={feedId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Figma-style section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-neutral-200 px-4 py-4">
      <h3 className="mb-3 text-sm font-medium text-neutral-900">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Segmented control (Figma-style toggle group) ── */
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex-1 rounded-md py-1 text-xs font-medium transition-all",
            value === opt.id
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── Compact row: label + control side-by-side ── */
function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] text-neutral-600">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

/* ── Compact number input ── */
function NumInput({
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="flex h-7 w-[56px] items-center overflow-hidden rounded-md border border-neutral-300 bg-white">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-full w-full border-0 bg-transparent px-2 text-right text-[12px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && (
        <span className="pr-1.5 text-[10px] text-[var(--color-text-soft)]">{suffix}</span>
      )}
    </div>
  );
}

/* ── Mini select ── */
function MiniSelect({
  value,
  options,
  onChange,
}: {
  value: string | number;
  options: Array<{ value: string | number; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 rounded-md border border-neutral-300 bg-white px-2 pr-6 text-[12px] outline-none appearance-none bg-no-repeat bg-[right_6px_center]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5' fill='none'><path d='M1 1l3 3 3-3' stroke='%236b7280' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── Toggle switch ── */
function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[13px] text-neutral-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-4 w-7 rounded-full transition-colors",
          checked ? "bg-brand-500" : "bg-neutral-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all",
            checked ? "left-[14px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

/* ── Combined Design Panel ── */
function DesignPanel({
  settings,
  update,
}: {
  settings: FeedSettings;
  update: <K extends keyof FeedSettings>(k: K, v: FeedSettings[K]) => void;
}) {
  return (
    <>
      {/* Layout */}
      <Section title="Layout">
        <Segmented
          options={[
            { id: "grid", label: "Grid" },
            { id: "showcase", label: "Showcase" },
            { id: "masonry", label: "Masonry" },
          ]}
          value={(settings.layout ?? "grid") as string}
          onChange={(v) => update("layout", v as FeedSettings["layout"])}
        />
        <div className="mt-3 space-y-0.5">
          <PropRow label="Columns">
            <MiniSelect
              value={settings.columns}
              options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
              onChange={(v) => update("columns", Number(v))}
            />
          </PropRow>
          <PropRow label="Rows">
            <MiniSelect
              value={settings.rows}
              options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
              onChange={(v) => update("rows", Number(v))}
            />
          </PropRow>
          <PropRow label="Posts">
            <MiniSelect
              value={settings.postCount}
              options={[4, 6, 8, 12, 16, 20, 24].map((n) => ({ value: n, label: String(n) }))}
              onChange={(v) => update("postCount", Number(v))}
            />
          </PropRow>
          <PropRow label="Gap">
            <NumInput value={settings.gap} onChange={(v) => update("gap", v)} min={0} max={32} suffix="px" />
          </PropRow>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Segmented
          options={[
            { id: "clean", label: "Clean" },
            { id: "rounded", label: "Rounded" },
            { id: "elevated", label: "Elevated" },
          ]}
          value={(settings.cardStyle ?? "clean") as string}
          onChange={(v) => update("cardStyle", v as FeedSettings["cardStyle"])}
        />
        <div className="mt-3 space-y-0.5">
          <PropRow label="Radius">
            <NumInput
              value={settings.borderRadius}
              onChange={(v) => update("borderRadius", v)}
              min={0}
              max={24}
              suffix="px"
            />
          </PropRow>
          <PropRow label="Background">
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={settings.backgroundColor || "#ffffff"}
                onChange={(e) => update("backgroundColor", e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-md border border-neutral-300 bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
              />
              <input
                type="text"
                value={settings.backgroundColor || ""}
                onChange={(e) => update("backgroundColor", e.target.value)}
                placeholder="transparent"
                className="h-7 w-[80px] rounded-md border border-neutral-300 bg-white px-2 text-[11px] outline-none"
              />
            </div>
          </PropRow>
          <PropRow label="Hover">
            <MiniSelect
              value={settings.hoverStyle ?? "zoom"}
              options={[
                { value: "zoom", label: "Zoom" },
                { value: "overlay", label: "Overlay" },
                { value: "lift", label: "Lift" },
                { value: "none", label: "None" },
              ]}
              onChange={(v) => {
                update("hoverStyle", v as FeedSettings["hoverStyle"]);
                update("hoverEffect", v !== "none");
              }}
            />
          </PropRow>
        </div>
      </Section>

      {/* Content */}
      <Section title="Content">
        <div className="space-y-0.5">
          <PropRow label="Account">
            <div className="flex h-7 w-[120px] items-center overflow-hidden rounded-md border border-neutral-300 bg-white">
              <span className="pl-2 text-[11px] text-[var(--color-text-soft)]">@</span>
              <input
                value={(settings.instagramHandle ?? "").replace(/^@/, "")}
                onChange={(e) => update("instagramHandle", e.target.value)}
                placeholder="username"
                className="h-full flex-1 border-0 bg-transparent px-1 text-[12px] outline-none"
              />
            </div>
          </PropRow>
          <PropRow label="Order">
            <MiniSelect
              value={settings.order ?? "newest"}
              options={[
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" },
              ]}
              onChange={(v) => update("order", v as FeedSettings["order"])}
            />
          </PropRow>
          <Switch
            label="Captions"
            checked={!!settings.showCaption}
            onChange={(v) => update("showCaption", v)}
          />
          <Switch
            label="Hover effects"
            checked={!!settings.hoverEffect}
            onChange={(v) => {
              update("hoverEffect", v);
              if (!v) update("hoverStyle", "none");
              else if (settings.hoverStyle === "none") update("hoverStyle", "zoom");
            }}
          />
          <PropRow label="Header">
            <div className="flex h-7 w-[120px] items-center overflow-hidden rounded-md border border-neutral-300 bg-white">
              <input
                value={settings.headerName ?? ""}
                onChange={(e) => update("headerName", e.target.value)}
                placeholder="Optional"
                className="h-full w-full border-0 bg-transparent px-2 text-[12px] outline-none"
              />
            </div>
          </PropRow>
        </div>
      </Section>
    </>
  );
}

/* ── Deploy panel (inline, no separate file needed) ── */
function DeployInlinePanel({ feedId }: { feedId: string }) {
  const [copied, setCopied] = useState(false);
  const snippet = getEmbedSnippet(feedId);

  const copy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Section title="Embed code">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Paste into your HTML
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-1.5 py-0.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] leading-relaxed text-neutral-800">
          <code>{snippet}</code>
        </pre>
      </Section>

      <Section title="Steps">
        <ol className="space-y-2">
          {[
            "Save your widget to store the latest settings.",
            "Copy the embed code above.",
            "Paste it into your page before </body>.",
            "Set api-base to your live API URL.",
          ].map((text, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-neutral-600">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 font-mono text-[10px] font-medium text-neutral-700">
                {i + 1}
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}

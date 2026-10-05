import { useState } from "react";
import { Camera, ArrowRight, Images, Film, Users } from "lucide-react";
import { api, defaultFeedSettings } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

type Source = "instagram-feed" | "instagram-stories" | "instagram-reels";

const sources: Array<{
  id: Source;
  title: string;
  description: string;
  icon: typeof Camera;
  available: boolean;
}> = [
  {
    id: "instagram-feed",
    title: "Camera feed",
    description: "Responsive grid of posts from any public profile.",
    icon: Images,
    available: true,
  },
  {
    id: "instagram-stories",
    title: "Camera stories",
    description: "Live stories carousel. Coming soon.",
    icon: Film,
    available: false,
  },
  {
    id: "instagram-reels",
    title: "Camera reels",
    description: "Reels showcase with autoplay. Coming soon.",
    icon: Users,
    available: false,
  },
];

export function CreateWidget() {
  const [step, setStep] = useState<"source" | "details">("source");
  const [source, setSource] = useState<Source>("instagram-feed");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const feed = await api.createFeed({
        name: name.trim(),
        settings: { ...defaultFeedSettings, instagramHandle: handle.trim().replace(/^@/, "") },
      });
      window.location.href = `/widgets/edit?id=${feed.id}`;
    } catch (err) {
      setError((err as Error).message);
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3 text-[12px] text-[var(--color-text-soft)]">
        <StepPill active={step === "source"} done={step !== "source"} index={1} label="Source" />
        <span className="h-px w-6 bg-[var(--color-border)]" />
        <StepPill active={step === "details"} done={false} index={2} label="Details" />
      </div>

      {step === "source" ? (
        <div className="animate-fade-in">
          <div className="mb-5">
            <h2 className="text-[18px] font-semibold text-[var(--color-text)]">
              Choose a data source
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
              Pick what your widget will display. You can change settings and theme later.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {sources.map((s) => {
              const Icon = s.icon;
              const selected = source === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setSource(s.id)}
                  className={cn(
                    "flex gap-3 rounded-[var(--radius-lg)] border p-4 text-left transition-all",
                    selected
                      ? "border-[var(--color-primary)] bg-[color:color-mix(in_oklab,var(--color-primary)_5%,transparent)]"
                      : "border-[var(--color-border-soft)] bg-[var(--color-surface)] hover:border-[var(--color-border)]",
                    !s.available && "cursor-not-allowed opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
                      selected
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13.5px] font-medium text-[var(--color-text)]">
                      {s.title}
                      {!s.available && (
                        <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-soft)]">
                          soon
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
                      {s.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={() => setStep("details")} iconRight={<ArrowRight size={14} />}>
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="animate-fade-in">
          <div className="mb-5">
            <h2 className="text-[18px] font-semibold text-[var(--color-text)]">
              Set up your Camera feed
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
              Give your widget a name and connect a public Camera profile.
            </p>
          </div>

          <div className="space-y-5 rounded-[var(--radius-xl)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6">
            <Field label="Widget name">
              <TextInput
                required
                autoFocus
                placeholder="e.g. Homepage gallery"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field
              label="Camera username"
              hint="public profile only"
            >
              <div className="flex h-10 items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[color:color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
                <span className="pl-3.5 pr-1 text-[13px] text-[var(--color-text-soft)]">@</span>
                <input
                  required
                  value={handle.replace(/^@/, "")}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="username"
                  className="h-full flex-1 border-0 bg-transparent pr-3.5 text-[13px] outline-none placeholder:text-[var(--color-text-soft)]"
                />
              </div>
            </Field>

            {error && (
              <div className="rounded-[var(--radius-md)] bg-[color:color-mix(in_oklab,var(--color-danger)_8%,transparent)] px-3 py-2 text-[12.5px] text-[var(--color-danger)]">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("source")}
              className="text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              ← Back
            </button>
            <Button type="submit" loading={creating} disabled={!name.trim() || !handle.trim()}>
              Create widget
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function StepPill({
  active,
  done,
  index,
  label,
}: {
  active: boolean;
  done: boolean;
  index: number;
  label: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1 text-[12px] font-medium transition-colors",
        active
          ? "bg-[var(--color-primary)] text-white"
          : done
            ? "bg-[color:color-mix(in_oklab,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]"
            : "bg-[var(--color-surface-2)] text-[var(--color-text-soft)]",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold",
          active
            ? "bg-white/20"
            : done
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-border)]",
        )}
      >
        {index}
      </span>
      {label}
    </span>
  );
}

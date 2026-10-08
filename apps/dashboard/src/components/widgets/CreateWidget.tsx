import { useState } from "react";
import { api, defaultFeedSettings } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";

export function CreateWidget() {
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
    <div className="mx-auto w-full max-w-[480px]">
      <h1 className="text-[20px] font-semibold text-[var(--color-text)]">New widget</h1>
      <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
        Connect a public Instagram profile. You can customize layout and theme in the editor.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <Field label="Widget name">
          <TextInput
            required
            autoFocus
            placeholder="Homepage feed"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Instagram username">
          <div className="flex h-10 items-center overflow-hidden rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)]">
            <span className="pl-3 pr-1 text-[13px] text-[var(--color-text-soft)]">@</span>
            <input
              required
              value={handle.replace(/^@/, "")}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="username"
              className="h-full flex-1 border-0 bg-transparent pr-3 text-[13px] outline-none"
            />
          </div>
        </Field>

        {error && (
          <div className="rounded-[6px] bg-[color:color-mix(in_oklab,var(--color-danger)_8%,transparent)] px-3 py-2 text-[13px] text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <a
            href="/"
            className="inline-flex h-9 items-center px-3 text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Cancel
          </a>
          <Button type="submit" loading={creating} disabled={!name.trim() || !handle.trim()}>
            Create widget
          </Button>
        </div>
      </form>
    </div>
  );
}

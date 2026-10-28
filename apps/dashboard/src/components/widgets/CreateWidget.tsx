import { useState } from "react";
import { api, defaultFeedSettings } from "@/lib/api";
import { Button, buttonClass } from "@/components/ui/Button";
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
    <div className="mx-auto w-full max-w-[520px]">
      <h1 className="page-title text-2xl sm:text-[28px]">New widget</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Connect a public Instagram profile. You can customize layout and theme in the editor.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl bg-white p-5 shadow-sm shadow-black/5 ring-1 ring-black/5 sm:p-6">
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
          <div className="flex h-9 items-center overflow-hidden rounded-md border border-neutral-300 bg-white transition-colors focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
            <span className="flex h-full items-center border-r border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-500">@</span>
            <input
              required
              value={handle.replace(/^@/, "")}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="username"
              className="h-full flex-1 border-0 bg-transparent px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus-visible:outline-none"
            />
          </div>
        </Field>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <a href="/" className={buttonClass("secondary", "md")}>
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

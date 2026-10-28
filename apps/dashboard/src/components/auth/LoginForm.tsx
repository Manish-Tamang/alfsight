import { useState } from "react";
import { KeyRound } from "lucide-react";
import { verifyToken } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";

function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next") ?? "/";
  // Only follow same-site paths.
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function LoginForm() {
  const [token, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = token.trim();
    if (!value) return;

    try {
      setChecking(true);
      setError(null);
      if (!(await verifyToken(value))) {
        setError("That token was not accepted by the API.");
        return;
      }
      setToken(value);
      window.location.href = nextPath();
    } catch {
      setError("Could not reach the API. Check PUBLIC_API_BASE and that the Worker is deployed.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl bg-white p-6 shadow-xl shadow-black/5 ring-1 ring-black/5">
      <div className="flex size-10 items-center justify-center rounded-[10px] border border-brand-200 bg-brand-50 text-brand-700">
        <KeyRound size={18} strokeWidth={1.75} />
      </div>
      <div>
        <h1 className="page-title text-xl">Sign in to Alfsight</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Paste the <code className="rounded bg-neutral-100 px-1 font-mono text-[12px]">ADMIN_TOKEN</code> you set on the API Worker.
        </p>
      </div>

      <Field label="Admin token">
        <TextInput
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          value={token}
          onChange={(e) => setValue(e.target.value)}
          placeholder="••••••••••••••••"
        />
      </Field>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <Button type="submit" size="lg" loading={checking} disabled={!token.trim()} className="w-full">
        Sign in
      </Button>
    </form>
  );
}

import { Globe2, ShieldCheck, UserRound } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";

export function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and application settings."
      />

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-[var(--radius)] bg-indigo-50 p-2 text-[var(--color-primary)]">
              <UserRound size={16} />
            </span>
            <div>
              <h2 className="font-heading text-sm font-semibold">Account</h2>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
                Account management will be available after authentication is implemented.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="rounded-[var(--radius)] bg-indigo-50 p-2 text-[var(--color-primary)]">
              <Globe2 size={16} />
            </span>
            <div>
              <h2 className="font-heading text-sm font-semibold">API Configuration</h2>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
                Your API base URL for widget embed codes.
              </p>
            </div>
          </div>
          <div className="ml-9">
            <code className="block rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-mono text-[var(--color-muted-foreground)]">
              {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787"}
            </code>
          </div>
        </Card>

        <Card className="border-red-200 p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-[var(--radius)] bg-red-50 p-2 text-red-600">
              <ShieldCheck size={16} />
            </span>
            <div>
              <h2 className="font-heading text-sm font-semibold">Danger Zone</h2>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
                Destructive actions will be available here.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

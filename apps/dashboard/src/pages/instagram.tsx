import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, CheckCircle2, Link2, Unplug } from "lucide-react";
import { Alert, Button, Card, PageHeader } from "@/components/ui";

interface ConnectedAccount {
  id: string;
  instagramUserId: string;
  username: string;
  profilePictureUrl?: string | null;
  expiresAt: string;
  createdAt: string;
}

export function InstagramPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const connectedParam = searchParams.get("connected");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      searchParams.delete("error");
      setSearchParams(searchParams, { replace: true });
    } else if (connectedParam) {
      setSuccess("Instagram account connected successfully!");
      searchParams.delete("connected");
      setSearchParams(searchParams, { replace: true });
    }

    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/instagram/accounts", {
        headers: { "x-dev-user-id": "dev-user-1" },
      });

      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/instagram/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-user-id": "dev-user-1",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to start Instagram connection");
      }

      if (data.authorizationUrl) {
        const url = new URL(data.authorizationUrl);
        if (!url.searchParams.get("client_id")) {
          throw new Error(
            "The backend did not provide a Meta App ID. Please restart 'pnpm dev' in your terminal so Wrangler reloads apps/api/.dev.vars!"
          );
        }
        window.location.href = data.authorizationUrl;
      }
    } catch (err: any) {
      console.error("Connect failed:", err);
      setError(err.message || "Failed to connect to Instagram");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this Instagram account?")) return;

    try {
      const res = await fetch(`/api/instagram/accounts/${id}`, {
        method: "DELETE",
        headers: { "x-dev-user-id": "dev-user-1" },
      });

      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setSuccess("Account disconnected.");
      }
    } catch (err) {
      console.error("Failed to disconnect account:", err);
    }
  };

  return (
    <div>
      <PageHeader
        title="Instagram Accounts"
        description="Connect your Instagram Professional accounts."
        action={
          accounts.length > 0 ? (
            <Button onClick={handleConnect} loading={connecting}>
              <Link2 size={14} />
              Connect another
            </Button>
          ) : undefined
        }
      />

      {success && (
        <Alert onClose={() => setSuccess(null)}>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} />
            {success}
          </span>
        </Alert>
      )}

      {error && (
        <Alert tone="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Card className="p-10 text-center text-sm text-[var(--color-muted-foreground)]">
          Loading accounts...
        </Card>
      ) : accounts.length > 0 ? (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="flex items-center gap-3">
                {account.profilePictureUrl ? (
                  <img
                    src={account.profilePictureUrl}
                    alt={account.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white">
                    <Camera size={18} />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-foreground)]">
                    @{account.username}
                  </h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    ID: {account.instagramUserId} · Connected{" "}
                    {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDisconnect(account.id)}
              >
                <Unplug size={12} />
                Disconnect
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed p-14 text-center">
          <div className="text-[var(--color-muted-foreground)]">
            <svg
              className="mx-auto mb-4"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            <p className="text-sm font-medium text-[var(--color-foreground)] mb-1">
              No accounts connected
            </p>
            <p className="text-sm mb-5">
              Connect an Instagram Professional account to start pulling media.
            </p>
            <Button onClick={handleConnect} disabled={connecting}>
              <Link2 size={14} />
              {connecting ? "Connecting..." : "Connect Instagram"}
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-[var(--color-muted-foreground)]">
        <p className="font-medium text-[var(--color-foreground)] mb-1">Requirements</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs">
          <li>Instagram Business or Creator account</li>
          <li>Facebook Page connected to the Instagram account</li>
          <li>Meta App with Instagram API permissions</li>
        </ul>
      </div>
    </div>
  );
}

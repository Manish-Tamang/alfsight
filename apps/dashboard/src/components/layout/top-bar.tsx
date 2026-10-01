import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";

interface AccountInfo {
  username: string;
  profilePictureUrl?: string | null;
}

export function TopBar() {
  const [account, setAccount] = useState<AccountInfo | null>(null);

  useEffect(() => {
    fetch("/api/instagram/accounts", {
      headers: { "x-dev-user-id": "dev-user-1" },
    })
      .then((res) => res.json())
      .then((data: AccountInfo[]) => {
        if (data.length > 0) {
          setAccount(data[0] ?? null);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-white px-6">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3">
          <Search size={14} className="text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="Search or type a command"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-foreground)]"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--color-border)] bg-white px-1.5 py-0.5 text-[10px] text-[var(--color-muted-foreground)]">
            ⌘ F
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] cursor-pointer">
          <Bell size={16} />
        </button>

        {account?.profilePictureUrl ? (
          <img
            src={account.profilePictureUrl}
            alt={account.username}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-medium text-[var(--color-muted-foreground)]">
            {account?.username?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
      </div>
    </header>
  );
}

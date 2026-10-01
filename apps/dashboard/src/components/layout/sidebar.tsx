import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Camera,
  ChartNoAxesCombined,
  Settings2,
  HelpCircle,
} from "lucide-react";

const mainNav = [
  { label: "Feeds", path: "/", icon: ChartNoAxesCombined },
  { label: "Instagram", path: "/instagram", icon: Camera },
] as const;

const bottomNav = [
  { label: "Settings", path: "/settings", icon: Settings2 },
  { label: "Help & Support", path: "/settings", icon: HelpCircle },
] as const;

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed top-0 left-0 z-30 flex h-screen w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)]">
      <div className="flex h-14 items-center px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] bg-[var(--color-primary)] text-white">
            <Camera size={14} />
          </span>
          <span className="font-heading text-sm font-semibold text-[var(--color-foreground)]">
            Alfsight
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {mainNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path + item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-sidebar-active)] text-[var(--color-primary)]"
                  : "text-[var(--color-sidebar-text)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] px-3 py-3 space-y-0.5">
        {bottomNav.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-[13px] font-medium text-[var(--color-sidebar-text)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

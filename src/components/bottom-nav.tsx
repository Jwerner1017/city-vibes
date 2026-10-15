import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Compass, Gift, Heart, MapPinned, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", icon: Compass, label: "Discover" },
  { to: "/holidays", icon: Gift, label: "Seasons" },
  { to: "/neighborhoods", icon: MapPinned, label: "Hoods" },
  { to: "/saved", icon: Heart, label: "Saved" },
  { to: "/profile", icon: User, label: "Profile" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={(e) => {
                if (!active) return;
                // Re-selecting the active tab resets it to its root and scrolls to top
                e.preventDefault();
                void navigate({ to, replace: true, search: {} as never });
                window.scrollTo({ top: 0, behavior: "smooth" });
                document.querySelectorAll(".overflow-y-auto").forEach((el) => el.scrollTo({ top: 0, behavior: "smooth" }));
              }}
              className={cn(
                "flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-[color,background-color] duration-[var(--motion-quick)]",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-fg",
              )}
            >
              <Icon className={cn("size-5", active && "stroke-[2.25]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
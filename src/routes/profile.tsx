import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Ghost,
  Heart,
  Info,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  User,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { getSavedIds, subscribeSaved } from "@/lib/saved";
import { useCity } from "@/components/city-provider";
import { getHosted, manageUrl, subscribeHosted, type HostedListing } from "@/lib/hosted";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

const LINKS = [
  { to: "/saved", icon: Heart, label: "Saved events" },
  { to: "/holidays/halloween/host", icon: Ghost, label: "Host a trunk-or-treat" },
  { to: "/create", icon: Plus, label: "Add a community event" },
  { to: "/cities", icon: MapPin, label: "Switch city" },
  { to: "/about", icon: Info, label: "About City Vibes" },
] as const;

function ProfilePage() {
  const { user, isPending } = useCurrentUserState();
  const { selectedCity } = useCity();
  const [savedCount, setSavedCount] = useState(0);
  const [hosted, setHosted] = useState<HostedListing[]>([]);
  useEffect(() => {
    const sync = () => setSavedCount(getSavedIds().length);
    sync();
    return subscribeSaved(sync);
  }, []);
  useEffect(() => {
    const sync = () => setHosted(getHosted());
    sync();
    return subscribeHosted(sync);
  }, []);

  return (
    <div className="min-h-dvh bg-bg pb-28">
      <header className="border-b border-border bg-surface px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          City Vibes
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Profile</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        <section className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="" className="size-14 rounded-full object-cover" />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-6" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-medium">
              {isPending ? "Loading…" : user?.displayName || (user ? "City Vibes member" : "Guest")}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.primaryEmail || `Exploring ${selectedCity.name}`}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Stat value={savedCount} label="Saved" />
          <Stat value={selectedCity.name} label="Home city" />
        </section>

        {hosted.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-border bg-surface">
            <p className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Your listings
            </p>
            {hosted.map((l) => (
              <a
                key={l.id}
                href={manageUrl(l.token)}
                className="flex min-h-12 items-center gap-3 border-b border-border px-4 py-2 last:border-b-0 hover:bg-muted"
              >
                <Pencil className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{l.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {new Date(l.date_start).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </a>
            ))}
          </section>
        )}

        <nav className="overflow-hidden rounded-2xl border border-border bg-surface">
          {LINKS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-12 items-center gap-3 border-b border-border px-4 last:border-b-0 hover:bg-muted"
            >
              <Icon className="size-4 text-primary" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </nav>

        {user && !user.isDevFallback ? (
          <div className="space-y-3">
            <Button
              variant="outline"
              className="h-12 w-full gap-2 rounded-xl"
              onClick={() => signOut("/")}
            >
              <LogOut /> Sign out
            </Button>
            <DeleteAccountDialog />
          </div>
        ) : !isPending && !user ? (
          <Button asChild className="h-12 w-full gap-2 rounded-xl">
            <Link to="/login">
              <LogIn /> Sign in
            </Link>
          </Button>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="truncate font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

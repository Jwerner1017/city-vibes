import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { listEvents } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { BottomNav } from "@/components/bottom-nav";
import { EventCard } from "@/components/event-card";
import { getSavedIds, subscribeSaved } from "@/lib/saved";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
});

function SavedPage() {
  const { selectedCity } = useCity();
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    const sync = () => setIds(getSavedIds());
    sync();
    return subscribeSaved(sync);
  }, []);

  const eventsQuery = useQuery({
    queryKey: ["events", selectedCity.id, "saved-pool"],
    queryFn: () =>
      listEvents({
        data: {
          cityId: selectedCity.id,
          lat: selectedCity.latitude,
          lng: selectedCity.longitude,
        },
      }),
    enabled: selectedCity.id > 0,
  });

  const saved = useMemo(
    () => (eventsQuery.data ?? []).filter((e) => ids.includes(e.id)),
    [eventsQuery.data, ids],
  );

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="border-b border-border bg-surface px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">City Vibes</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kept on this device — no account required.
        </p>
      </header>
      <div className="px-4 pt-4">
        {saved.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Heart className="mb-3 size-10 text-muted-foreground/40" />
            <p className="font-display text-lg font-medium">Nothing saved yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Tap the heart on anything you might actually go to.
            </p>
            <Link
              to="/"
              className="mt-4 text-sm font-medium text-primary"
            >
              Browse {selectedCity.name}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {saved.map((e) => (
              <EventCard key={e.id} event={e} compact />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

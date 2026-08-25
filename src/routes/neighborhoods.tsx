import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { listEvents, listNeighborhoods } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { BottomNav } from "@/components/bottom-nav";
import { EventCard } from "@/components/event-card";
import { distanceMiles } from "@/lib/geo";
import { groupRunningEvents } from "@/lib/event-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/neighborhoods")({
  component: NeighborhoodsPage,
});

function NeighborhoodsPage() {
  const { selectedCity } = useCity();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const hoodsQuery = useQuery({
    queryKey: ["hoods", selectedCity.id],
    queryFn: () => listNeighborhoods({ data: { cityId: selectedCity.id } }),
    enabled: selectedCity.id > 0,
  });
  const eventsQuery = useQuery({
    queryKey: ["events", selectedCity.id, "hoods"],
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

  const hoods = hoodsQuery.data ?? [];
  const selected = hoods.find((h) => h.id === selectedId) ?? null;
  const nearby = useMemo(() => {
    if (!selected) return [];
    return groupRunningEvents(eventsQuery.data ?? []).filter((e) =>
      distanceMiles(selected.latitude, selected.longitude, e.latitude, e.longitude) <=
      (selected.radius_miles || 2),
    );
  }, [selected, eventsQuery.data]);

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="border-b border-border bg-surface px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">City Vibes</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Neighborhoods</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a pocket of {selectedCity.name} and see what's actually nearby.
        </p>
      </header>
      <div className="px-4 pt-4">
        {hoods.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Neighborhood guides land first in Louisville. Switch cities from the header, or check
            Discover for citywide listings.
          </p>
        ) : (
          <div className="grid gap-2">
            {hoods.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedId(n.id === selectedId ? null : n.id)}
                className={cn(
                  "rounded-2xl bg-surface p-4 text-left shadow-[var(--shadow-border)] transition-shadow",
                  selectedId === n.id && "shadow-[var(--shadow-lift)] ring-2 ring-ring",
                )}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="font-display text-base font-medium">{n.name}</p>
                    <p className="text-xs font-medium text-primary">{n.vibe}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{n.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {selected && (
          <div className="mt-6">
            <h2 className="mb-3 font-display text-sm font-medium">
              Within about {selected.radius_miles} miles of {selected.name}
            </h2>
            {nearby.length === 0 ? (
              <p className="text-sm text-muted-foreground">Quiet on the calendar for this pocket.</p>
            ) : (
              <div className="space-y-2">
                {nearby.map((e) => (
                  <EventCard key={e.id} event={e} compact />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

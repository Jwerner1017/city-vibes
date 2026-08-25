import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { listEvents, listNeighborhoods } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { EventCard } from "@/components/event-card";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/holidays/halloween")({
  component: HalloweenHub,
});

function HalloweenHub() {
  const { selectedCity } = useCity();
  const eventsQuery = useQuery({
    queryKey: ["events", selectedCity.id, "halloween"],
    queryFn: () =>
      listEvents({
        data: {
          cityId: selectedCity.id,
          lat: selectedCity.latitude,
          lng: selectedCity.longitude,
          holiday: "halloween",
        },
      }),
    enabled: selectedCity.id > 0,
  });
  const hoodsQuery = useQuery({
    queryKey: ["hoods", selectedCity.id],
    queryFn: () => listNeighborhoods({ data: { cityId: selectedCity.id } }),
    enabled: selectedCity.id > 0,
  });

  const events = eventsQuery.data ?? [];

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="bg-accent px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] text-accent-foreground">
        <Link to="/holidays" className="inline-flex size-11 items-center" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Halloween</h1>
        <p className="mt-2 max-w-md text-sm text-accent-foreground/80">
          Boo at the Zoo, treat streets, and the neighborhoods that still decorate like it's a
          competition.
        </p>
      </header>
      <div className="px-4 pt-5">
        <h2 className="mb-3 font-display text-sm font-medium">Where to wander</h2>
        <div className="space-y-2">
          {(hoodsQuery.data ?? []).slice(0, 6).map((n) => (
            <Link
              key={n.id}
              to="/neighborhoods"
              className="block rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
            >
              <p className="font-display text-sm font-medium">{n.name}</p>
              <p className="text-xs text-muted-foreground">{n.vibe}</p>
            </Link>
          ))}
        </div>
        <h2 className="mb-3 mt-8 font-display text-sm font-medium">Listed nights</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Seasonal listings land as the zoo and parks publish them. Check back after Labor Day.
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} compact />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

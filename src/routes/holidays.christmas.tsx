import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { listEvents } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { EventCard } from "@/components/event-card";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/holidays/christmas")({
  component: ChristmasHub,
});

function ChristmasHub() {
  const { selectedCity } = useCity();
  const eventsQuery = useQuery({
    queryKey: ["events", selectedCity.id, "christmas"],
    queryFn: () =>
      listEvents({
        data: {
          cityId: selectedCity.id,
          lat: selectedCity.latitude,
          lng: selectedCity.longitude,
          holiday: "christmas",
        },
      }),
    enabled: selectedCity.id > 0,
  });

  const events = eventsQuery.data ?? [];

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="bg-primary px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] text-primary-foreground">
        <Link to="/holidays" className="inline-flex size-11 items-center" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Christmas</h1>
        <p className="mt-2 max-w-md text-sm text-primary-foreground/80">
          Wild Lights, Lights Under Louisville, and the markets that smell like sugar and pine.
        </p>
      </header>
      <div className="px-4 pt-5">
        <h2 className="mb-3 font-display text-sm font-medium">Trackers the kids will ask for</h2>
        <div className="grid gap-2">
          <a
            href="https://www.noradsanta.org"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]"
          >
            NORAD Santa Tracker
            <ExternalLink className="size-4 text-muted-foreground" />
          </a>
          <a
            href="https://santatracker.google.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]"
          >
            Google Santa Tracker
            <ExternalLink className="size-4 text-muted-foreground" />
          </a>
        </div>
        <h2 className="mb-3 mt-8 font-display text-sm font-medium">Listed this season</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Holiday lights listings appear once venues publish dates — usually late October.
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

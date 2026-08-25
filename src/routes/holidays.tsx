import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { listEvents } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { BottomNav } from "@/components/bottom-nav";
import { EventCard } from "@/components/event-card";
import { HOLIDAY_CONFIG, RADIUS_MILES } from "@/lib/constants";
import { distanceMiles } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { HolidayKey } from "@/lib/types";

export const Route = createFileRoute("/holidays")({
  component: HolidaysPage,
});

const HUBS: Array<{
  key: HolidayKey;
  title: string;
  blurb: string;
  href?: string;
}> = [
  {
    key: "halloween",
    title: "Halloween",
    blurb: "Treat maps, zoo nights, and the neighborhoods that actually go all-in.",
    href: "/holidays/halloween",
  },
  {
    key: "christmas",
    title: "Christmas",
    blurb: "Lights, markets, Santa photos — and the two trackers everyone opens in December.",
    href: "/holidays/christmas",
  },
  {
    key: "july_4th",
    title: "July 4th",
    blurb: "Thunder leftover energy: river fireworks and the free lawns.",
  },
  {
    key: "easter",
    title: "Easter",
    blurb: "Egg hunts and spring festivals that don't require a church directory.",
  },
  {
    key: "st_patricks",
    title: "St. Patrick's",
    blurb: "Parades and family hours — skip the crawl.",
  },
  {
    key: "thanksgiving",
    title: "Thanksgiving",
    blurb: "Turkey trots and the few events that aren't just a grocery list.",
  },
  {
    key: "labor_day",
    title: "Labor Day",
    blurb: "WorldFest weekend and the last-swim energy of summer.",
  },
];

function HolidaysPage() {
  const { selectedCity } = useCity();
  const eventsQuery = useQuery({
    queryKey: ["events", selectedCity.id, "holidays"],
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

  const nearby = (eventsQuery.data ?? []).filter(
    (e) =>
      e.latitude &&
      distanceMiles(selectedCity.latitude, selectedCity.longitude, e.latitude, e.longitude) <=
        RADIUS_MILES,
  );

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="border-b border-border bg-surface px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">City Vibes</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Seasons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The holidays people actually plan around in {selectedCity.name}.
        </p>
      </header>
      <div className="space-y-3 px-4 pt-4">
        {HUBS.map((hub) => {
          const count = nearby.filter((e) => e.holiday === hub.key).length;
          const inner = (
            <div className="flex items-center justify-between overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]">
              <div className={cn("w-1.5 self-stretch", HOLIDAY_CONFIG[hub.key].colorClass)} />
              <div className="flex flex-1 items-center justify-between p-4">
              <div>
                <p className="font-display text-lg font-medium tracking-tight">{hub.title}</p>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{hub.blurb}</p>
                <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                  {count} listed
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </div>
          );
          return hub.href ? (
            <Link key={hub.key} to={hub.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={hub.key}>{inner}</div>
          );
        })}
      </div>
      {nearby.filter((e) => e.holiday !== "none").length > 0 && (
        <div className="px-4 pt-8">
          <h2 className="mb-3 font-display text-sm font-medium">On the calendar</h2>
          <div className="space-y-2">
            {nearby
              .filter((e) => e.holiday !== "none")
              .slice(0, 8)
              .map((e) => (
                <EventCard key={e.id} event={e} compact />
              ))}
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

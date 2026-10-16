import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, MapPinPlus, X } from "lucide-react";
import { listEvents, listNeighborhoods } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { EventCard } from "@/components/event-card";
import { EventMap } from "@/components/event-map";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { areasForCity, eventArea } from "@/lib/areas";
import { groupEventsByDay } from "@/lib/event-utils";
import { cn } from "@/lib/utils";
import type { EventItem } from "@/lib/types";

export const Route = createFileRoute("/holidays/halloween/")({
  component: HalloweenHub,
});

type Kind = "trunk" | "all";

function HalloweenHub() {
  const { selectedCity } = useCity();
  const [kind, setKind] = useState<Kind>("trunk");
  const [area, setArea] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventItem | null>(null);

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

  const areas = useMemo(
    () => areasForCity(selectedCity.name, selectedCity.state_code),
    [selectedCity.name, selectedCity.state_code],
  );

  // Upcoming only: anything that hasn't ended yet, each tagged with its area.
  const upcoming = useMemo(() => {
    const now = Date.now();
    return (eventsQuery.data ?? [])
      .filter((e) => new Date(e.date_end || e.date_start).getTime() >= now - 3_600_000)
      .map((e) => ({ event: e, area: eventArea(areas, e) }));
  }, [eventsQuery.data, areas]);

  const ofKind = upcoming.filter(
    ({ event }) => kind === "all" || event.category === "trick_or_treat",
  );
  const areaCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { area: a } of ofKind) if (a) counts.set(a, (counts.get(a) ?? 0) + 1);
    return [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
  }, [ofKind]);
  const shown = ofKind.filter(({ area: a }) => !area || a === area).map(({ event }) => event);
  const trunkCount = upcoming.filter(({ event }) => event.category === "trick_or_treat").length;
  // Runs that started before today (pumpkin trails, haunted houses) read as "on now".
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const ongoing = shown.filter(
    (e) => !e.is_permanent && new Date(e.date_start).getTime() < todayStart,
  );
  const days = [
    ...(ongoing.length ? [{ key: "ongoing", label: "Going on now", items: ongoing }] : []),
    ...groupEventsByDay(shown.filter((e) => !ongoing.includes(e))),
  ];

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="bg-accent px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] text-accent-foreground">
        <Link to="/holidays" className="inline-flex size-11 items-center" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Halloween</h1>
        <p className="mt-2 max-w-md text-sm text-accent-foreground/80">
          Trunk-or-treats, Boo at the Zoo, and the streets that go all-in — posted by the people
          hosting them, all on one map.
        </p>
        <Button asChild variant="secondary" className="mt-4 rounded-full">
          <Link to="/holidays/halloween/host">
            <MapPinPlus /> Host a trunk-or-treat
          </Link>
        </Button>
      </header>

      <div className="sticky top-0 z-20 space-y-2 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur-md">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4" aria-label="What to show">
          <Chip
            active={kind === "trunk"}
            onClick={() => {
              setKind("trunk");
              setArea(null);
            }}
          >
            Trunk-or-treats{trunkCount ? ` · ${trunkCount}` : ""}
          </Chip>
          <Chip
            active={kind === "all"}
            onClick={() => {
              setKind("all");
              setArea(null);
            }}
          >
            All Halloween{upcoming.length ? ` · ${upcoming.length}` : ""}
          </Chip>
        </div>
        {areaCounts.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filter by area">
            <Chip small active={!area} onClick={() => setArea(null)}>
              All areas
            </Chip>
            {areaCounts.map(([name, n]) => (
              <Chip
                key={name}
                small
                active={area === name}
                onClick={() => setArea(area === name ? null : name)}
              >
                {name} · {n}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        <div className="relative h-72 overflow-hidden rounded-2xl shadow-[var(--shadow-border)]">
          <EventMap
            events={shown}
            selectedId={selected?.id ?? null}
            onEventTap={setSelected}
            cityCenter={[selectedCity.latitude, selectedCity.longitude]}
            cityZoom={selectedCity.zoom}
          />
        </div>
        {selected && shown.some((e) => e.id === selected.id) && (
          <div className="relative mt-3">
            <EventCard event={selected} compact />
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute -right-1 -top-2 flex size-7 items-center justify-center rounded-full bg-surface shadow-[var(--shadow-border)]"
              aria-label="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {eventsQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ) : shown.length === 0 ? (
            <EmptyHalloween kind={kind} city={selectedCity.name} />
          ) : (
            days.map((day) => (
              <section key={day.key}>
                <h2 className="mb-2 font-display text-sm font-medium">{day.label}</h2>
                <div className="space-y-2">
                  {day.items.map((e) => (
                    <EventCard key={e.id} event={e} compact />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {(hoodsQuery.data ?? []).length > 0 && (
          <>
            <h2 className="mb-3 mt-10 font-display text-sm font-medium">Where to wander</h2>
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
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function EmptyHalloween({ kind, city }: { kind: Kind; city: string }) {
  return (
    <div className="rounded-2xl bg-surface p-5 text-center shadow-[var(--shadow-border)]">
      <p className="font-display text-base">
        {kind === "trunk" ? `No trunk-or-treats posted in ${city} yet.` : "Nothing listed yet."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Know one from a Facebook group or church bulletin? Put it on the map — it takes a minute.
      </p>
      <Button asChild className="mt-4 rounded-full">
        <Link to="/holidays/halloween/host">
          <MapPinPlus /> Add a trunk-or-treat
        </Link>
      </Button>
    </div>
  );
}

function Chip({
  active,
  small,
  onClick,
  children,
}: {
  active: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border font-medium transition-colors",
        small ? "min-h-9 px-3 text-xs" : "min-h-11 px-4 text-sm",
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-fg hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

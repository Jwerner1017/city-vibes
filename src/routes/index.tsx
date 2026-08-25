import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  List,
  Map as MapIcon,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { listEvents, runSync } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { CitySelector } from "@/components/city-selector";
import { BottomNav } from "@/components/bottom-nav";
import { EventMap } from "@/components/event-map";
import { EventCard } from "@/components/event-card";
import { FilterBar } from "@/components/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { eventsOnDate, groupEventsByDay, groupRunningEvents, windowBounds } from "@/lib/event-utils";
import { distanceMiles } from "@/lib/geo";
import { RADIUS_MILES } from "@/lib/constants";
import type { EventFilters, EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: DiscoverInner,
});

const VIEWS = [
  { id: "map" as const, icon: MapIcon, label: "Map" },
  { id: "calendar" as const, icon: CalendarDays, label: "Calendar" },
  { id: "list" as const, icon: List, label: "List" },
];

function DiscoverInner() {
  const { selectedCity } = useCity();
  const [filters, setFilters] = useState<EventFilters>({ window: "week" });
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"map" | "calendar" | "list">("map");
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [pickedDate, setPickedDate] = useState<string | null>(null);

  const syncedFor = useRef<number | null>(null);

  const eventsQuery = useQuery({
    queryKey: [
      "events",
      selectedCity.id,
      filters.category,
      filters.holiday,
      filters.is_free,
      filters.age_min,
      filters.age_max,
    ],
    queryFn: () =>
      listEvents({
        data: {
          cityId: selectedCity.id,
          lat: selectedCity.latitude,
          lng: selectedCity.longitude,
          category: filters.category,
          holiday: filters.holiday,
          is_free: filters.is_free,
          age_min: filters.age_min,
          age_max: filters.age_max,
        },
      }),
    enabled: selectedCity.id > 0,
  });

  useEffect(() => {
    if (!selectedCity.id) return;
    if (syncedFor.current === selectedCity.id) return;
    syncedFor.current = selectedCity.id;
    let cancelled = false;
    setSyncing(true);
    runSync({
      data: {
        cityId: selectedCity.id,
        forceLouisville: selectedCity.name === "Louisville",
      },
    })
      .then((res) => {
        if (cancelled) return;
        const n = res.cities.reduce((s, c) => s + c.synced + c.updated, 0);
        if (n > 0) {
          setSyncNote(`Pulled ${n} listings from local calendars`);
          window.setTimeout(() => setSyncNote(null), 4000);
          void eventsQuery.refetch();
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity.id]);

  const grouped = useMemo(() => {
    const raw = eventsQuery.data ?? [];
    const nearby = raw.filter((e) => {
      if (!e.latitude || !e.longitude) return false;
      return (
        distanceMiles(selectedCity.latitude, selectedCity.longitude, e.latitude, e.longitude) <=
        RADIUS_MILES
      );
    });
    let list = groupRunningEvents(nearby);
    if (filters.window && filters.window !== "all") {
      const { start, end } = windowBounds(filters.window);
      list = list.filter((e) => {
        if (e.is_permanent) return true;
        const s = new Date(e.date_start).getTime();
        const last = new Date(e.range_end || e.date_end || e.date_start).getTime();
        return last >= start.getTime() && s <= end.getTime();
      });
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((e) =>
        `${e.title} ${e.location_name || ""} ${e.address || ""} ${e.description || ""}`
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [eventsQuery.data, selectedCity, filters.window, query]);

  const upcoming = grouped
    .filter((e) => !e.is_permanent)
    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
  const permanents = grouped.filter((e) => e.is_permanent);
  const featured = upcoming.filter((e) => e.featured).slice(0, 8);
  const byDay = groupEventsByDay(upcoming);
  const tonightStrip = upcoming.slice(0, 12);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const todayStr = isoLocal(new Date());
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="relative z-20 border-b border-border bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-3">
          <Link to="/about" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            City Vibes
          </Link>
          <Link
            to="/create"
            aria-label="Add an event"
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-border)]"
          >
            <Plus className="size-5" />
          </Link>
        </div>
        <div className="flex items-end justify-between gap-3 px-4 pb-2 pt-1">
          <div className="min-w-0">
            <h1 className="font-display text-[1.7rem] font-semibold leading-none tracking-tight">
              {selectedCity.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <CitySelector hideName />
              {!eventsQuery.isLoading && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {upcoming.length} happening
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center rounded-full bg-muted p-0.5">
            {VIEWS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-label={label}
                aria-pressed={view === id}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3",
                  view === id
                    ? "bg-surface text-fg shadow-[var(--shadow-border)]"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          query={view === "map" ? undefined : query}
          onQuery={view === "map" ? undefined : setQuery}
        />
        {(syncing || syncNote) && (
          <p className="px-4 pb-2 text-[11px] text-muted-foreground">
            {syncing ? "Checking zoo, parks, and visitor calendars…" : syncNote}
          </p>
        )}
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {eventsQuery.isLoading ? (
          <div className="flex h-full flex-col gap-3 p-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : (
          <>
            {view === "map" && (
              <div className="absolute inset-0">
                <EventMap
                  events={grouped}
                  selectedId={selected?.id}
                  onEventTap={setSelected}
                  cityCenter={[selectedCity.latitude, selectedCity.longitude]}
                  cityZoom={selectedCity.zoom}
                />
                {selected && (
                  <div className="absolute left-4 right-4 top-3 z-30 sm:left-auto sm:right-4 sm:w-80">
                    <button
                      onClick={() => setSelected(null)}
                      className="absolute -right-1 -top-2 z-10 flex size-8 items-center justify-center rounded-full bg-surface shadow-[var(--shadow-border)]"
                      aria-label="Close"
                    >
                      <X className="size-4" />
                    </button>
                    <EventCard event={selected} compact />
                  </div>
                )}
                {tonightStrip.length > 0 && (
                  <div className="absolute inset-x-0 bottom-20 z-20">
                    <div className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
                      {tonightStrip.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className={cn(
                            "snap-start w-56 shrink-0 rounded-xl bg-surface/95 p-3 text-left shadow-[var(--shadow-lift)] backdrop-blur-sm transition-transform",
                            selected?.id === e.id && "ring-2 ring-ring",
                          )}
                        >
                          <p className="truncate font-display text-sm font-medium tracking-tight">
                            {e.title}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {e.location_name || "Louisville"} · {e.is_free ? "Free" : "Tickets"}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === "calendar" && (
              <div className="h-full overflow-y-auto px-4 pb-32 pt-4">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    className="flex size-11 items-center justify-center rounded-full hover:bg-muted"
                    onClick={() =>
                      setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
                    }
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <h2 className="font-display text-lg font-medium">{monthLabel}</h2>
                  <button
                    className="flex size-11 items-center justify-center rounded-full hover:bg-muted"
                    onClick={() =>
                      setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
                    }
                    aria-label="Next month"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
                <div className="overflow-hidden rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
                  <div className="mb-1 grid grid-cols-7 gap-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div
                        key={`${d}-${i}`}
                        className="py-1 text-center text-xs font-medium text-muted-foreground"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startDay }).map((_, i) => (
                      <div key={`e-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dayEvents = eventsOnDate(grouped, dateStr);
                      const isToday = dateStr === todayStr;
                      const isPicked = dateStr === pickedDate;
                      return (
                        <button
                          key={day}
                          onClick={() => setPickedDate(dateStr === pickedDate ? null : dateStr)}
                          className={cn(
                            "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm",
                            isPicked && "bg-primary text-primary-foreground",
                            !isPicked && isToday && "bg-primary/10 font-semibold text-primary",
                            !isPicked && !isToday && "hover:bg-muted",
                          )}
                        >
                          <span>{day}</span>
                          {dayEvents.length > 0 && (
                            <span className="flex gap-0.5">
                              {dayEvents.slice(0, 3).map((e) => (
                                <span
                                  key={e.id}
                                  className={cn(
                                    "size-1.5 rounded-full",
                                    isPicked ? "bg-primary-foreground" : "bg-primary",
                                  )}
                                />
                              ))}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {pickedDate && (
                  <div className="mt-6">
                    <h3 className="mb-3 font-display text-sm font-medium">
                      {new Date(pickedDate + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                      <span className="ml-2 font-sans font-normal text-muted-foreground">
                        {eventsOnDate(grouped, pickedDate).length}
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {eventsOnDate(grouped, pickedDate).map((e) => (
                        <EventCard key={e.id} event={e} compact hideWhen />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === "list" && (
              <div className="h-full overflow-y-auto px-4 pb-32 pt-4">
                {upcoming.length === 0 && permanents.length === 0 ? (
                  <EmptyState city={selectedCity.name} query={query} />
                ) : (
                  <>
                    {featured.length > 0 && (
                      <section className="mb-6">
                        <h3 className="mb-3 font-display text-sm font-medium">Don't miss</h3>
                        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                          {featured.map((e) => (
                            <EventCard key={e.id} event={e} featured />
                          ))}
                        </div>
                      </section>
                    )}
                    {byDay.map((day) => (
                      <section key={day.key} className="mb-6">
                        <h3 className="sticky top-0 z-10 mb-3 bg-bg/90 py-1 font-display text-sm font-medium backdrop-blur-sm">
                          {day.label}
                          <span className="ml-2 font-sans font-normal text-muted-foreground">
                            {day.items.length}
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {day.items.map((e) => (
                            <EventCard key={e.id} event={e} compact hideWhen />
                          ))}
                        </div>
                      </section>
                    ))}
                    {permanents.length > 0 && (
                      <section>
                        <h3 className="mb-3 font-display text-sm font-medium">Always around</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {permanents.map((e) => (
                            <EventCard key={e.id} event={e} />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function EmptyState({ city, query }: { city: string; query: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <Compass className="mb-3 size-10 text-muted-foreground/50" />
      <p className="font-display text-lg font-medium">
        {query ? "Nothing matches that" : "Nothing on the board yet"}
      </p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {query
          ? "Try a venue, a neighborhood, or clear the search."
          : `Live calendars for ${city} are still filling in. Permanent spots stay on the map.`}
      </p>
      <Link
        to="/create"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        <Sparkles className="size-4" />
        Add something happening
      </Link>
    </div>
  );
}

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

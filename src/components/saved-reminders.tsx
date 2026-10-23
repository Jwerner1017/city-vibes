import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BellRing, X } from "lucide-react";
import { listEvents } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { getSavedIds, subscribeSaved } from "@/lib/saved";

const DISMISS_KEY = "cityvibes-dismissed-reminders";
const DAY = 24 * 60 * 60 * 1000;

function readDismissed(): number[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function SavedReminders() {
  const { selectedCity } = useCity();
  const [ids, setIds] = useState<number[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
    const sync = () => setIds(getSavedIds());
    sync();
    return subscribeSaved(sync);
  }, []);

  const { data } = useQuery({
    queryKey: ["events", selectedCity.id, "saved-pool"],
    queryFn: () =>
      listEvents({ data: { cityId: selectedCity.id, lat: selectedCity.latitude, lng: selectedCity.longitude } }),
    enabled: selectedCity.id > 0 && ids.length > 0,
  });

  const upcoming = useMemo(() => {
    const now = Date.now();
    return (data ?? []).filter((e) => {
      const start = new Date(e.date_start).getTime();
      return ids.includes(e.id) && !dismissed.includes(e.id) && start > now && start - now <= DAY;
    });
  }, [data, ids, dismissed]);

  if (upcoming.length === 0) return null;

  const dismiss = (id: number) => {
    const next = [...dismissed, id];
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    setDismissed(next);
  };

  return (
    <div className="space-y-2">
      {upcoming.map((e) => (
        <div key={e.id} className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3">
          <BellRing className="mt-0.5 size-5 shrink-0 text-primary" />
          <Link to="/event/$id" params={{ id: String(e.id) }} className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Coming up within 24 hours</p>
            <p className="truncate font-medium">{e.title}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(e.date_start).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}
            </p>
          </Link>
          <button onClick={() => dismiss(e.id)} aria-label="Dismiss reminder" className="p-1 text-muted-foreground">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
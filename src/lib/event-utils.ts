import type { EventItem } from "./types";

export function groupRunningEvents(events: EventItem[]): EventItem[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime(),
  );
  const groups = new Map<string, EventItem[]>();
  for (const e of sorted) {
    const key = `${(e.title || "").toLowerCase().trim()}|${(e.location_name || "").toLowerCase().trim()}`;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  const result: EventItem[] = [];
  for (const list of groups.values()) {
    let run: EventItem[] = [list[0]];
    for (let i = 1; i < list.length; i++) {
      const prev = startOfDay(run[run.length - 1].date_start);
      const cur = startOfDay(list[i].date_start);
      const diffDays = (cur - prev) / 86_400_000;
      if (diffDays <= 1) run.push(list[i]);
      else {
        result.push(mergeRun(run));
        run = [list[i]];
      }
    }
    result.push(mergeRun(run));
  }
  return result;
}

function mergeRun(run: EventItem[]): EventItem {
  if (run.length === 1) return run[0];
  const first = run[0];
  const last = run[run.length - 1];
  return {
    ...first,
    date_end: last.date_end || last.date_start,
    is_running_event: true,
    range_end: last.date_start,
  };
}

export function eventsOnDate(events: EventItem[], dateStr: string): EventItem[] {
  return events.filter((e) => {
    const start = isoDate(e.date_start);
    const end = isoDate(e.range_end || e.date_end || e.date_start);
    return dateStr >= start && dateStr <= end;
  });
}

export function isoDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDay(value: string | Date): number {
  const d = typeof value === "string" ? new Date(value) : new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatEventWhen(event: EventItem): string {
  const start = new Date(event.date_start);
  if (Number.isNaN(start.getTime())) return "";
  const endRaw = event.range_end || event.date_end;
  const end = endRaw ? new Date(endRaw) : null;
  const sameDay =
    !end ||
    Number.isNaN(end.getTime()) ||
    isoDate(start) === isoDate(end) ||
    !event.is_running_event;

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!sameDay && end) {
    return `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
  }
  if (event.is_permanent) return "Open regularly";
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}`;
}

export function dateStamp(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { month: "", day: "", weekday: "" };
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

export function groupEventsByDay(
  events: EventItem[],
): Array<{ key: string; label: string; items: EventItem[] }> {
  const today = isoDate(new Date());
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const tomorrow = isoDate(tom);

  const buckets = new Map<string, EventItem[]>();
  for (const e of events) {
    if (e.is_permanent) continue;
    const key = isoDate(e.date_start) || "later";
    const list = buckets.get(key) ?? [];
    list.push(e);
    buckets.set(key, list);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      let label: string;
      if (key === today) label = "Tonight";
      else if (key === tomorrow) label = "Tomorrow";
      else {
        const d = new Date(`${key}T12:00:00`);
        label = d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
      }
      return { key, label, items };
    });
}

export function formatTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function windowBounds(kind: "tonight" | "weekend" | "week" | "all"): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  if (kind === "all") {
    return { start: now, end: new Date(now.getTime() + 180 * 86_400_000) };
  }
  if (kind === "tonight") {
    const end = new Date(now);
    end.setHours(26, 0, 0, 0);
    return { start: now, end };
  }
  if (kind === "weekend") {
    const day = now.getDay();
    const start = new Date(now);
    if (day === 0) {
      start.setHours(0, 0, 0, 0);
    } else if (day === 6) {
      start.setHours(0, 0, 0, 0);
    } else {
      const add = 6 - day;
      start.setDate(start.getDate() + add);
      start.setHours(0, 0, 0, 0);
    }
    const end = new Date(start);
    const daysToSunday = start.getDay() === 0 ? 0 : 7 - start.getDay();
    end.setDate(start.getDate() + daysToSunday);
    end.setHours(23, 59, 59, 999);
    return { start: now > start ? now : start, end };
  }
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return { start: now, end };
}

export function icsForEvent(event: EventItem): string {
  const stamp = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const start = new Date(event.date_start);
  const end = new Date(event.date_end || event.date_start);
  if (end.getTime() <= start.getTime()) end.setHours(start.getHours() + 2);
  const desc = (event.description || "").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//City Vibes//EN",
    "BEGIN:VEVENT",
    `UID:cityvibes-${event.id}@cityvibes`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(desc)}`,
    event.address ? `LOCATION:${escapeIcs(event.address)}` : "",
    event.website_url ? `URL:${event.website_url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function escapeIcs(value: string): string {
  return value.replace(/[,;\\]/g, (m) => `\\${m}`).slice(0, 500);
}

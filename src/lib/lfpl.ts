import type { IncomingEvent } from "@/lib/sources";
import { UA, decodeHtml, startOfToday } from "@/lib/sources";

/** Louisville Free Public Library branches — used to drop storytimes on the map. */
const BRANCHES: Record<string, { lat: number; lng: number; address: string }> = {
  "main": { lat: 38.2476, lng: -85.7574, address: "301 York St, Louisville, KY 40203" },
  "bon air": { lat: 38.2186, lng: -85.6508, address: "2816 Del Rio Pl, Louisville, KY 40220" },
  "crescent hill": { lat: 38.2535, lng: -85.6905, address: "2762 Frankfort Ave, Louisville, KY 40206" },
  "fairdale": { lat: 38.1052, lng: -85.7588, address: "10620 W Manslick Rd, Louisville, KY 40118" },
  "iroquois": { lat: 38.1894, lng: -85.7784, address: "601 W Woodlawn Ave, Louisville, KY 40215" },
  "jeffersontown": { lat: 38.1942, lng: -85.5643, address: "10635 Watterson Trail, Louisville, KY 40299" },
  "middletown": { lat: 38.2454, lng: -85.5382, address: "12513 Old Shelbyville Rd, Louisville, KY 40243" },
  "newburg": { lat: 38.1854, lng: -85.6615, address: "4800 Exeter Ave, Louisville, KY 40218" },
  "northeast": { lat: 38.2688, lng: -85.5716, address: "15 Bellevoir Cir, Louisville, KY 40223" },
  "portland": { lat: 38.2702, lng: -85.7915, address: "3305 Northwestern Pkwy, Louisville, KY 40212" },
  "shawnee": { lat: 38.2506, lng: -85.8142, address: "3912 W Broadway, Louisville, KY 40211" },
  "south central": { lat: 38.1558, lng: -85.6705, address: "7300 Jefferson Blvd, Louisville, KY 40219" },
  "southwest": { lat: 38.1215, lng: -85.8624, address: "9725 Dixie Hwy, Louisville, KY 40272" },
  "st. matthews": { lat: 38.2524, lng: -85.6421, address: "3940 Grandview Ave, Louisville, KY 40207" },
  "st matthews": { lat: 38.2524, lng: -85.6421, address: "3940 Grandview Ave, Louisville, KY 40207" },
  "western": { lat: 38.2481, lng: -85.7674, address: "604 S 10th St, Louisville, KY 40203" },
  "shelby park": { lat: 38.2372, lng: -85.7471, address: "600 E Oak St, Louisville, KY 40203" },
  "highlands": { lat: 38.2362, lng: -85.7218, address: "1250 Bardstown Rd, Louisville, KY 40204" },
  "highlands-shelby": { lat: 38.2362, lng: -85.7218, address: "1250 Bardstown Rd, Louisville, KY 40204" },
};

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function easternOffset(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month, day));
  const mar = new Date(Date.UTC(year, 2, 1));
  const nov = new Date(Date.UTC(year, 10, 1));
  const secondSunMar = 1 + ((7 - mar.getUTCDay()) % 7) + 7;
  const firstSunNov = 1 + ((7 - nov.getUTCDay()) % 7);
  const start = Date.UTC(year, 2, secondSunMar);
  const end = Date.UTC(year, 10, firstSunNov);
  return d.getTime() >= start && d.getTime() < end ? "-04:00" : "-05:00";
}

function parseClock(raw: string): { h: number; m: number } | null {
  const m = raw.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2] || "0", 10);
  const ap = m[3];
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return { h, m: min };
}

function louisvilleIso(year: number, month: number, day: number, h: number, min: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const off = easternOffset(year, month, day);
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(h)}:${pad(min)}:00${off}`;
}

function parseLfplWhen(text: string): { start: string; end: string } | null {
  const m = text.replace(/\s+/g, " ").match(
    /([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+at\s+(\d{1,2}(?::\d{2})?\s*[ap]m)(?:\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[ap]m))?/i,
  );
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (month == null) return null;
  const day = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  const startClock = parseClock(m[4]);
  const endClock = m[5] ? parseClock(m[5]) : null;
  if (!startClock) return null;
  const start = louisvilleIso(year, month, day, startClock.h, startClock.m);
  const end = endClock
    ? louisvilleIso(year, month, day, endClock.h, endClock.m)
    : louisvilleIso(year, month, day, startClock.h + 1, startClock.m);
  return { start, end };
}

function lookupBranch(location: string) {
  const lower = location.toLowerCase();
  for (const [name, geo] of Object.entries(BRANCHES)) {
    if (lower.startsWith(name) || lower.includes(` ${name} `) || lower.includes(`at ${name}`)) {
      return { name, ...geo };
    }
  }
  return { name: location.split("-")[0].trim() || "LFPL", lat: 38.2527, lng: -85.7585, address: "Louisville, KY" };
}

function agesFromTitle(title: string): { age_min: number; age_max: number } {
  const t = title.toLowerCase();
  if (/\bbaby\b|\binfant\b|\blapsit\b|\blap sit\b/.test(t)) return { age_min: 0, age_max: 2 };
  if (/\btoddler\b/.test(t)) return { age_min: 1, age_max: 4 };
  if (/\bpreschool\b/.test(t)) return { age_min: 3, age_max: 5 };
  if (/\bstorytime\b|\bstory time\b/.test(t)) return { age_min: 0, age_max: 6 };
  if (/\bteen\b/.test(t)) return { age_min: 13, age_max: 18 };
  if (/\bkids?\b|\bchildren\b|\bafterschool\b/.test(t)) return { age_min: 5, age_max: 12 };
  return { age_min: 0, age_max: 18 };
}

function parsePage(html: string): IncomingEvent[] {
  const events: IncomingEvent[] = [];
  const blocks = html.split(/class="lc-event lc-event--list"/).slice(1);
  for (const block of blocks) {
    const link = block.match(/href="(\/event\/[^"]+)\"/);
    const titleM = block.match(/class="lc-event__link">\s*([^<]+)/);
    const dateM = block.match(/lc-list-event-info-item--date">\s*([^<]+)/);
    const locM = block.match(/lc-list-event-location">\s*([^<]+)/);
    const title = decodeHtml((titleM?.[1] || "").trim());
    const when = parseLfplWhen(dateM?.[1] || "");
    if (!title || !when) continue;
    if (new Date(when.end) < startOfToday()) continue;
    const location = decodeHtml((locM?.[1] || "Louisville Free Public Library").replace(/\s+/g, " ").trim());
    const branch = lookupBranch(location);
    const ages = agesFromTitle(title);
    events.push({
      title,
      description: `${title} at ${location}. Free library program — just show up.`,
      date_start: when.start,
      date_end: when.end,
      location_name: location,
      address: branch.address,
      latitude: branch.lat,
      longitude: branch.lng,
      category: /storytime|story time|lapsit|toddler|preschool/i.test(title) ? "education" : "community",
      is_free: true,
      website_url: `https://events.lfpl.org${link?.[1] || "/events/list"}`,
      age_min: ages.age_min,
      age_max: ages.age_max,
      source: "lfpl",
    });
  }
  return events;
}

const MAX_PAGES = 4;

export async function fetchLfpl(): Promise<IncomingEvent[]> {
  const pages = await Promise.all(
    Array.from({ length: MAX_PAGES }, (_, i) => i).map(async (page) => {
      const url = `https://events.lfpl.org/events/list?page=${page}`;
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(12_000) });
      if (!res.ok) return [] as IncomingEvent[];
      return parsePage(await res.text());
    }),
  );
  const seen = new Set<string>();
  const out: IncomingEvent[] = [];
  for (const ev of pages.flat()) {
    const key = `${ev.title}|${ev.date_start}|${ev.location_name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }
  return out.slice(0, 120);
}

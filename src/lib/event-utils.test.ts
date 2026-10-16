import { test } from "node:test";
import assert from "node:assert/strict";
import { formatEventWhen } from "./event-utils.ts";
import type { EventItem } from "./types.ts";

const HOUR = 3_600_000;

function ev(over: Partial<EventItem>): EventItem {
  return {
    id: 1,
    city_id: 1,
    title: "Test",
    description: null,
    date_start: new Date(Date.now() + 24 * HOUR).toISOString(),
    date_end: null,
    location_name: null,
    address: null,
    latitude: 38.25,
    longitude: -85.76,
    category: "community",
    holiday: "none",
    photos: [],
    is_free: true,
    price_info: null,
    age_min: 0,
    age_max: 18,
    is_permanent: false,
    website_url: null,
    host_name: null,
    neighborhood: null,
    amenities: [],
    status: "approved",
    featured: false,
    source: "community",
    ...over,
  };
}

test("a same-evening listing shows its time range", () => {
  const start = new Date(Date.now() + 24 * HOUR);
  const text = formatEventWhen(
    ev({ date_start: start.toISOString(), date_end: new Date(+start + 2.5 * HOUR).toISOString() }),
  );
  assert.match(text, / · .+ – .+/);
});

test("RSS items never show the end time sync made up", () => {
  const start = new Date(Date.now() + 24 * HOUR);
  const text = formatEventWhen(
    ev({
      source: "rss",
      date_start: start.toISOString(),
      date_end: new Date(+start + 3 * HOUR).toISOString(),
    }),
  );
  assert.doesNotMatch(text, / – /);
});

test("a multi-day run already underway says until when", () => {
  const text = formatEventWhen(
    ev({
      date_start: new Date(Date.now() - 5 * 24 * HOUR).toISOString(),
      date_end: new Date(Date.now() + 3 * 24 * HOUR).toISOString(),
    }),
  );
  assert.match(text, /^Through /);
});

test("a start-only listing shows just the start", () => {
  assert.doesNotMatch(formatEventWhen(ev({})), / – |Through/);
});

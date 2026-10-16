import { test } from "node:test";
import assert from "node:assert/strict";
import { validateHostInput, isWellFormedToken, type HostInput } from "./hosting.ts";
import { areasForCity, eventArea, nearestArea } from "./areas.ts";

const LOUISVILLE = { name: "Louisville", latitude: 38.2527, longitude: -85.7585 };
const NOW = Date.parse("2026-10-16T12:00:00Z");
const OPTS = { now: NOW, maxMiles: 50, validCategories: ["community", "music", "trick_or_treat"] };

function trunk(overrides: Partial<HostInput> = {}): HostInput {
  return {
    cityId: 1,
    kind: "trunk_or_treat",
    title: "St. Agnes Trunk-or-Treat",
    host_name: "St. Agnes Church",
    date_start: "2026-10-30T22:00:00Z",
    date_end: "2026-10-31T00:30:00Z",
    address: "1920 Newburg Rd",
    latitude: 38.2208,
    longitude: -85.7047,
    amenities: ["teal_pumpkin", "made_up", "teal_pumpkin"],
    ...overrides,
  };
}

test("a complete trunk-or-treat is accepted and forced into the right category", () => {
  const r = validateHostInput(trunk({ category: "music" }), LOUISVILLE, OPTS);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.category, "trick_or_treat");
  assert.equal(r.value.host_name, "St. Agnes Church");
  assert.equal(r.value.location_name, "St. Agnes Church");
  assert.deepEqual(r.value.amenities, ["teal_pumpkin"]);
  assert.equal(r.value.date_end, "2026-10-31T00:30:00.000Z");
});

test("trunk-or-treats need a host and an end time", () => {
  assert.equal(validateHostInput(trunk({ host_name: " " }), LOUISVILLE, OPTS).ok, false);
  assert.equal(validateHostInput(trunk({ date_end: null }), LOUISVILLE, OPTS).ok, false);
});

test("plain community events default end to start and keep a valid category", () => {
  const r = validateHostInput(
    trunk({ kind: "event", host_name: "", date_end: null, category: "music" }),
    LOUISVILLE,
    OPTS,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.category, "music");
  assert.equal(r.value.date_end, r.value.date_start);
  assert.equal(r.value.host_name, null);
});

test("general events can't claim the trunk-or-treat category", () => {
  const r = validateHostInput(
    trunk({ kind: "event", category: "trick_or_treat" }),
    LOUISVILLE,
    OPTS,
  );
  assert.ok(r.ok && r.value.category === "holiday");
});

test("unknown categories fall back to community", () => {
  const r = validateHostInput(trunk({ kind: "event", category: "rave" }), LOUISVILLE, OPTS);
  assert.ok(r.ok && r.value.category === "community");
});

test("dates must be real, upcoming, ordered, and at most two weeks long", () => {
  assert.equal(validateHostInput(trunk({ date_start: "not a date" }), LOUISVILLE, OPTS).ok, false);
  assert.equal(
    validateHostInput(
      trunk({ date_start: "2026-10-10T22:00:00Z", date_end: "2026-10-10T23:00:00Z" }),
      LOUISVILLE,
      OPTS,
    ).ok,
    false,
  );
  assert.equal(
    validateHostInput(trunk({ date_end: "2026-10-30T21:00:00Z" }), LOUISVILLE, OPTS).ok,
    false,
  );
  assert.equal(
    validateHostInput(trunk({ date_end: "2026-11-20T00:00:00Z" }), LOUISVILLE, OPTS).ok,
    false,
  );
  assert.equal(
    validateHostInput(
      trunk({ date_start: "2028-10-30T22:00:00Z", date_end: "2028-10-30T23:00:00Z" }),
      LOUISVILLE,
      OPTS,
    ).ok,
    false,
  );
});

test("pins outside the city radius are rejected", () => {
  const r = validateHostInput(trunk({ latitude: 39.9612, longitude: -82.9988 }), LOUISVILLE, OPTS);
  assert.equal(r.ok, false);
  assert.equal(validateHostInput(trunk({ latitude: NaN }), LOUISVILLE, OPTS).ok, false);
});

test("only http(s) links are kept", () => {
  assert.equal(
    validateHostInput(trunk({ website_url: "javascript:alert(1)" }), LOUISVILLE, OPTS).ok,
    false,
  );
  const r = validateHostInput(trunk({ website_url: "https://stagnes.org/fall" }), LOUISVILLE, OPTS);
  assert.ok(r.ok && r.value.website_url === "https://stagnes.org/fall");
});

test("text is trimmed and length-capped", () => {
  const r = validateHostInput(trunk({ title: `  ${"x".repeat(500)}  ` }), LOUISVILLE, OPTS);
  assert.ok(r.ok && r.value.title.length === 200);
  assert.equal(validateHostInput(trunk({ title: " a " }), LOUISVILLE, OPTS).ok, false);
});

test("manage tokens must be long and URL-safe", () => {
  assert.equal(isWellFormedToken("abc"), false);
  assert.equal(isWellFormedToken("a".repeat(43)), true);
  assert.equal(isWellFormedToken(`${"a".repeat(42)}/`), false);
  assert.equal(isWellFormedToken(undefined), false);
});

test("addresses map to the area people would call them", () => {
  const areas = areasForCity("Louisville", "KY");
  assert.equal(nearestArea(areas, 38.240073, -85.724143), "The Highlands"); // 1000 Bardstown Rd
  assert.equal(nearestArea(areas, 38.1596, -85.5877), "Fern Creek");
  assert.equal(nearestArea(areas, 37.0, -86.5), null); // far outside every area
  assert.equal(
    eventArea(areas, { neighborhood: "Okolona", latitude: 38.24, longitude: -85.72 }),
    "Okolona",
  );
  assert.deepEqual(areasForCity("Nowhere", "ZZ"), []);
});

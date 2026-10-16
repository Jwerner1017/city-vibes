import { distanceMiles } from "./geo.ts";

/**
 * Areas people actually say when they tell you where a trunk-or-treat is —
 * wider than the curated neighborhood guide, which only covers the urban core.
 * Centers are approximate and only used to suggest a default; hosts can pick
 * any area from the list or type their own.
 */
export type Area = { name: string; latitude: number; longitude: number };

const LOUISVILLE_AREAS: Area[] = [
  { name: "Downtown", latitude: 38.2542, longitude: -85.7594 },
  { name: "NuLu", latitude: 38.2555, longitude: -85.74 },
  { name: "Butchertown", latitude: 38.262, longitude: -85.733 },
  { name: "Portland", latitude: 38.269, longitude: -85.79 },
  { name: "Russell", latitude: 38.256, longitude: -85.778 },
  { name: "Shawnee", latitude: 38.256, longitude: -85.824 },
  { name: "California", latitude: 38.238, longitude: -85.78 },
  { name: "Old Louisville", latitude: 38.229, longitude: -85.76 },
  { name: "Smoketown & Shelby Park", latitude: 38.239, longitude: -85.747 },
  { name: "Germantown & Schnitzelburg", latitude: 38.234, longitude: -85.731 },
  { name: "The Highlands", latitude: 38.238, longitude: -85.715 },
  { name: "Cherokee Triangle", latitude: 38.237, longitude: -85.702 },
  { name: "Clifton", latitude: 38.25, longitude: -85.71 },
  { name: "Crescent Hill", latitude: 38.256, longitude: -85.688 },
  { name: "St. Matthews", latitude: 38.253, longitude: -85.655 },
  { name: "Lyndon", latitude: 38.257, longitude: -85.601 },
  { name: "Hurstbourne", latitude: 38.238, longitude: -85.588 },
  { name: "Middletown", latitude: 38.245, longitude: -85.539 },
  { name: "Anchorage", latitude: 38.267, longitude: -85.533 },
  { name: "Prospect", latitude: 38.345, longitude: -85.616 },
  { name: "Hikes Point", latitude: 38.215, longitude: -85.642 },
  { name: "Buechel", latitude: 38.195, longitude: -85.652 },
  { name: "Jeffersontown", latitude: 38.194, longitude: -85.564 },
  { name: "Fern Creek", latitude: 38.16, longitude: -85.588 },
  { name: "Highview", latitude: 38.14, longitude: -85.625 },
  { name: "Okolona", latitude: 38.141, longitude: -85.688 },
  { name: "Audubon Park & Camp Taylor", latitude: 38.205, longitude: -85.724 },
  { name: "Beechmont", latitude: 38.188, longitude: -85.762 },
  { name: "Iroquois & South End", latitude: 38.177, longitude: -85.78 },
  { name: "Shively", latitude: 38.2, longitude: -85.823 },
  { name: "Pleasure Ridge Park", latitude: 38.145, longitude: -85.858 },
  { name: "Valley Station", latitude: 38.11, longitude: -85.87 },
  { name: "Fairdale", latitude: 38.105, longitude: -85.759 },
  { name: "Jeffersonville, IN", latitude: 38.2776, longitude: -85.7372 },
  { name: "Clarksville, IN", latitude: 38.2967, longitude: -85.7597 },
  { name: "New Albany, IN", latitude: 38.2856, longitude: -85.8241 },
];

const AREAS_BY_CITY: Record<string, Area[]> = {
  "Louisville|KY": LOUISVILLE_AREAS,
};

/** How far from an area's center a point can be and still be called that area. */
const MAX_AREA_MILES = 4;

export function areasForCity(cityName: string, stateCode: string): Area[] {
  return AREAS_BY_CITY[`${cityName}|${stateCode}`] ?? [];
}

export function nearestArea(areas: Area[], latitude: number, longitude: number): string | null {
  let best: { name: string; miles: number } | null = null;
  for (const a of areas) {
    const miles = distanceMiles(latitude, longitude, a.latitude, a.longitude);
    if (!best || miles < best.miles) best = { name: a.name, miles };
  }
  return best && best.miles <= MAX_AREA_MILES ? best.name : null;
}

/** Area for an event: what the host chose, else the nearest known area. */
export function eventArea(
  areas: Area[],
  event: { neighborhood?: string | null; latitude: number; longitude: number },
): string | null {
  const chosen = event.neighborhood?.trim();
  if (chosen) return chosen;
  return nearestArea(areas, event.latitude, event.longitude);
}

export const AMENITIES = [
  { key: "teal_pumpkin", label: "Allergy-friendly treats (teal pumpkin)" },
  { key: "indoor", label: "Indoors or rain plan" },
  { key: "accessible", label: "Wheelchair / stroller friendly" },
  { key: "sensory", label: "Sensory-friendly / low-scare" },
  { key: "costume_contest", label: "Costume contest" },
  { key: "games", label: "Games & activities" },
  { key: "food", label: "Food & drinks" },
] as const;

export type AmenityKey = (typeof AMENITIES)[number]["key"];

export const AMENITY_KEYS = AMENITIES.map((a) => a.key) as AmenityKey[];

export function amenityLabel(key: string): string | null {
  return AMENITIES.find((a) => a.key === key)?.label ?? null;
}

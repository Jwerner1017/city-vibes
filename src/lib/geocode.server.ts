import { distanceMiles } from "@/lib/geo";

export type GeocodeHit = {
  latitude: number;
  longitude: number;
  matched: string;
  source: "census" | "osm";
};

const TIMEOUT_MS = 6000;
const UA = "CityVibes/1.0 (community event map)";

/** Adds the city and state when the host typed only a street address. */
export function withCity(address: string, cityName: string, stateCode: string): string {
  const a = address.trim().replace(/\s+/g, " ");
  const lower = a.toLowerCase();
  if (lower.includes(cityName.toLowerCase()) || new RegExp(`\\b${stateCode}\\b`, "i").test(a)) {
    return a;
  }
  return `${a}, ${cityName}, ${stateCode}`;
}

async function census(q: string): Promise<GeocodeHit | null> {
  const url =
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress" +
    `?address=${encodeURIComponent(q)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    result?: {
      addressMatches?: Array<{ coordinates?: { x?: number; y?: number }; matchedAddress?: string }>;
    };
  };
  const hit = body.result?.addressMatches?.[0];
  const lat = Number(hit?.coordinates?.y);
  const lng = Number(hit?.coordinates?.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng, matched: hit?.matchedAddress ?? q, source: "census" };
}

async function osm(q: string): Promise<GeocodeHit | null> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us" +
    `&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const hit = body[0];
  const lat = Number(hit?.lat);
  const lng = Number(hit?.lon);
  if (!hit || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng, matched: hit.display_name ?? q, source: "osm" };
}

/**
 * Street addresses go to the US Census geocoder first (exact rooftop ranges, no
 * key); place names like "St. Agnes Church" fall back to OpenStreetMap. Results
 * outside the city's radius are discarded so a typo can't pin across the country.
 */
export async function geocode(
  address: string,
  city: { name: string; state_code: string; latitude: number; longitude: number },
  maxMiles: number,
): Promise<GeocodeHit | null> {
  const q = withCity(address, city.name, city.state_code);
  if (q.length < 4) return null;
  for (const lookup of [census, osm]) {
    try {
      const hit = await lookup(q);
      if (
        hit &&
        distanceMiles(city.latitude, city.longitude, hit.latitude, hit.longitude) <= maxMiles
      ) {
        return hit;
      }
    } catch {
      // A slow or down geocoder falls through to the next one.
    }
  }
  return null;
}

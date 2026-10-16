/**
 * Map tiles for every Leaflet map. CARTO's free basemaps now answer with an
 * "API key required" image, so the default is OpenStreetMap's standard tiles
 * (fine for a community app's traffic, attribution required). For heavier use,
 * point VITE_MAP_TILE_URL at a keyed provider (MapTiler, Stadia, Thunderforest)
 * and set VITE_MAP_TILE_ATTRIBUTION to match.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const TILE_URL =
  env.VITE_MAP_TILE_URL?.trim() || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
  env.VITE_MAP_TILE_ATTRIBUTION?.trim() ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

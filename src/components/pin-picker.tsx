import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/map-tiles";

type LeafletNS = typeof import("leaflet");

/**
 * A small map with one draggable pin. The parent owns the position; dragging
 * or tapping the map moves it and reports back.
 */
export function PinPicker({
  latitude,
  longitude,
  onMove,
  color = "#c45c1a",
}: {
  latitude: number;
  longitude: number;
  onMove: (latitude: number, longitude: number) => void;
  color?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const marker = useRef<import("leaflet").Marker | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    if (!el.current || map.current) return;
    let cancelled = false;
    (async () => {
      const mod = await import("leaflet");
      const L: LeafletNS = (mod as { default?: LeafletNS }).default ?? (mod as LeafletNS);
      if (cancelled || !el.current) return;
      const m = L.map(el.current, { center: [latitude, longitude], zoom: 16, zoomControl: false });
      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(m);
      L.control.zoom({ position: "topright" }).addTo(m);
      const icon = L.divIcon({
        className: "cv-pin",
        html: `<svg width="30" height="40" viewBox="0 0 28 36" fill="none" aria-hidden="true">
          <path d="M14 1.5c7.2 0 13 5.7 13 12.8 0 9.3-13 20.2-13 20.2S1 23.6 1 14.3C1 7.2 6.8 1.5 14 1.5z" fill="${color}" stroke="#fffcf6" stroke-width="2.2"/>
          <circle cx="14" cy="14" r="4.2" fill="#fffcf6"/></svg>`,
        iconSize: [30, 40],
        iconAnchor: [15, 38],
      });
      const pin = L.marker([latitude, longitude], { icon, draggable: true, autoPan: true }).addTo(
        m,
      );
      pin.on("dragend", () => {
        const p = pin.getLatLng();
        onMoveRef.current(p.lat, p.lng);
      });
      m.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        pin.setLatLng(e.latlng);
        onMoveRef.current(e.latlng.lat, e.latlng.lng);
      });
      map.current = m;
      marker.current = pin;
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // The map is created once; position updates flow through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pin = marker.current;
    const m = map.current;
    if (!pin || !m) return;
    const cur = pin.getLatLng();
    if (Math.abs(cur.lat - latitude) < 1e-7 && Math.abs(cur.lng - longitude) < 1e-7) return;
    pin.setLatLng([latitude, longitude]);
    m.setView([latitude, longitude], Math.max(m.getZoom(), 16));
  }, [latitude, longitude]);

  // The app's .leaflet-container rule is height: 100%, so the size lives on a wrapper.
  return (
    <div className="h-56 w-full overflow-hidden rounded-xl shadow-[var(--shadow-border)]">
      <div
        ref={el}
        className="size-full"
        role="application"
        aria-label="Map — drag the pin to the exact spot"
      />
    </div>
  );
}

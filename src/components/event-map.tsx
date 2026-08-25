import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { formatEventWhen } from "@/lib/event-utils";
import type { EventItem } from "@/lib/types";

type LeafletNS = typeof import("leaflet");

export function EventMap({
  events,
  onEventTap,
  selectedId,
  cityCenter,
  cityZoom,
}: {
  events: EventItem[];
  onEventTap?: (event: EventItem) => void;
  selectedId?: number | null;
  cityCenter: [number, number];
  cityZoom?: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const onTapRef = useRef(onEventTap);
  const readyRef = useRef(false);
  onTapRef.current = onEventTap;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;
    (async () => {
      const mod = await import("leaflet");
      const L: LeafletNS = (mod as { default?: LeafletNS }).default ?? (mod as LeafletNS);
      if (cancelled || !mapRef.current) return;
      const [lat, lng] = cityCenter;
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: cityZoom || 12,
        zoomControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OSM &copy; CARTO",
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      mapInstance.current = map;
      readyRef.current = true;
    })();
    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    let cancelled = false;
    (async () => {
      const mod = await import("leaflet");
      const L: LeafletNS = (mod as { default?: LeafletNS }).default ?? (mod as LeafletNS);
      if (cancelled) return;
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      const coordGroups: Record<string, EventItem[]> = {};
      for (const event of events) {
        const key = `${event.latitude.toFixed(4)},${event.longitude.toFixed(4)}`;
        (coordGroups[key] ??= []).push(event);
      }

      for (const event of events) {
        const cat = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.other;
        const isSelected = event.id === selectedId;
        const key = `${event.latitude.toFixed(4)},${event.longitude.toFixed(4)}`;
        const group = coordGroups[key] ?? [event];
        let lat = event.latitude;
        let lng = event.longitude;
        if (group.length > 1) {
          const idx = group.findIndex((e) => e.id === event.id);
          const angle = (2 * Math.PI * idx) / group.length;
          const radius = 0.0004 * Math.min(1 + Math.floor(idx / 8), 3);
          lat += radius * Math.cos(angle);
          lng += radius * Math.sin(angle);
        }
        const tokenName = cat.token.replace("var(--", "").replace(")", "");
        const color =
          getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim() ||
          "#1f6b4a";
        const w = isSelected ? 32 : 26;
        const h = isSelected ? 42 : 34;
        const icon = L.divIcon({
          className: `event-marker cv-pin${isSelected ? " is-selected" : ""}`,
          html: pinSvg(color, w, h, isSelected),
          iconSize: [w, h],
          iconAnchor: [w / 2, h - 2],
          popupAnchor: [0, -h + 8],
        });
        const marker = L.marker([lat, lng], { icon, zIndexOffset: isSelected ? 800 : 0 }).addTo(map);
        marker.bindPopup(
          `<div style="min-width:170px;max-width:220px">
            <div style="font-family:Fraunces,Georgia,serif;font-weight:600;font-size:14px;line-height:1.25;margin-bottom:4px;">${escapeHtml(event.title)}</div>
            <div style="font-size:12px;color:#5f5a52;">${escapeHtml(formatEventWhen(event))}</div>
            <div style="font-size:12px;color:#5f5a52;margin-top:2px;">${escapeHtml(event.location_name || event.address || "")}</div>
          </div>`,
          { closeButton: false },
        );
        marker.on("click", () => onTapRef.current?.(event));
        markersRef.current.push(marker);
      }

      const selected = events.find((e) => e.id === selectedId);
      if (selected) {
        map.panTo([selected.latitude, selected.longitude], { animate: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [events, selectedId]);

  const prevCity = useRef<string | null>(null);
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const [lat, lng] = cityCenter;
    if (!lat || !lng) return;
    const key = `${lat},${lng}`;
    if (prevCity.current === key) return;
    prevCity.current = key;
    map.flyTo([lat, lng], cityZoom || 12, { animate: true, duration: 1.1 });
  }, [cityCenter, cityZoom]);

  return <div ref={mapRef} className="size-full" />;
}

function pinSvg(color: string, w: number, h: number, selected: boolean) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 1.5c7.2 0 13 5.7 13 12.8 0 9.3-13 20.2-13 20.2S1 23.6 1 14.3C1 7.2 6.8 1.5 14 1.5z" fill="${color}" stroke="#fffcf6" stroke-width="${selected ? 2.4 : 1.8}"/>
    <circle cx="14" cy="14" r="4.2" fill="#fffcf6"/>
  </svg>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&" + "amp;";
    if (ch === "<") return "&" + "lt;";
    if (ch === ">") return "&" + "gt;";
    if (ch === '"') return "&" + "quot;";
    return "&#39;";
  });
}

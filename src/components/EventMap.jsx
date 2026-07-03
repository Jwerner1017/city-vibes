import React, { useEffect, useRef, useState } from "react";
import { CATEGORY_CONFIG } from "@/lib/constants";

const TIER_COLORS = { platinum: "#e5e4e2", gold: "#FFD700", silver: "#C0C0C0", bronze: "#CD7F32" };

export default function EventMap({ events, sponsors = [], onEventTap, onSponsorTap, selectedId, selectedSponsorId, cityCenter, cityZoom }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const sponsorMarkersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    if (!L) return;

    const safeCenter = (Array.isArray(cityCenter) && cityCenter[0] && cityCenter[1] && !isNaN(cityCenter[0]) && !isNaN(cityCenter[1]) && isFinite(cityCenter[0]) && isFinite(cityCenter[1]))
      ? cityCenter
      : [38.2527, -85.7585];
    const map = L.map(mapRef.current, {
      center: safeCenter,
      zoom: cityZoom || 11,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    mapInstance.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    const L = window.L;
    const map = mapInstance.current;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Spread out events that share (nearly) the same coordinates so they don't
    // stack into a single invisible marker on the map.
    const coordGroups = {};
    events.forEach(event => {
      if (!event.latitude || !event.longitude) return;
      const key = `${event.latitude.toFixed(3)},${event.longitude.toFixed(3)}`;
      (coordGroups[key] = coordGroups[key] || []).push(event);
    });

    events.forEach(event => {
      if (!event.latitude || !event.longitude) return;
      const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
      const isSelected = event.id === selectedId;

      const key = `${event.latitude.toFixed(3)},${event.longitude.toFixed(3)}`;
      const group = coordGroups[key];
      let lat = event.latitude;
      let lng = event.longitude;
      if (group.length > 1) {
        const idx = group.findIndex(e => e.id === event.id);
        const angle = (2 * Math.PI * idx) / group.length;
        const radius = 0.0009 * Math.min(1 + Math.floor(idx / 8), 3); // small offset, grows in rings
        lat += radius * Math.cos(angle);
        lng += radius * Math.sin(angle);
      }

      const icon = L.divIcon({
        className: "event-marker",
        html: `<div style="
          background: ${isSelected ? cat.color : "white"};
          color: ${isSelected ? "white" : cat.color};
          width: ${isSelected ? "42px" : "36px"};
          height: ${isSelected ? "42px" : "36px"};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isSelected ? "20px" : "16px"};
          border: 2.5px solid ${cat.color};
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s;
          cursor: pointer;
        ">${cat.emoji}</div>`,
        iconSize: [isSelected ? 42 : 36, isSelected ? 42 : 36],
        iconAnchor: [isSelected ? 21 : 18, isSelected ? 21 : 18],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.on("click", () => onEventTap?.(event));
      markersRef.current.push(marker);
    });
  }, [events, selectedId, mapReady, onEventTap]);

  // Sponsor markers
  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    const L = window.L;
    const map = mapInstance.current;

    sponsorMarkersRef.current.forEach(m => map.removeLayer(m));
    sponsorMarkersRef.current = [];

    sponsors.forEach(sponsor => {
      if (!sponsor.latitude || !sponsor.longitude) return;
      const isSelected = sponsor.id === selectedSponsorId;
      const tierColor = TIER_COLORS[sponsor.tier] || TIER_COLORS.bronze;
      const size = isSelected ? 44 : 36;

      const icon = L.divIcon({
        className: "event-marker",
        html: `<div style="
          background: ${isSelected ? tierColor : "#1a1a2e"};
          width: ${size}px; height: ${size}px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: ${isSelected ? "20px" : "16px"};
          border: 2.5px solid ${tierColor};
          box-shadow: 0 2px 12px rgba(0,0,0,0.3), 0 0 0 ${isSelected ? "3px" : "0"} ${tierColor}40;
          transition: all 0.2s; cursor: pointer;
        ">🏪</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([sponsor.latitude, sponsor.longitude], { icon }).addTo(map);
      marker.on("click", () => onSponsorTap?.(sponsor));
      sponsorMarkersRef.current.push(marker);
    });
  }, [sponsors, selectedSponsorId, mapReady, onSponsorTap]);

  // Fly to city when it changes
  const prevCityRef = useRef(null);
  useEffect(() => {
    if (!mapInstance.current || !mapReady || !Array.isArray(cityCenter)) return;
    const [lat, lng] = cityCenter;
    if (!lat || !lng || isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return;
    const key = `${lat},${lng}`;
    if (prevCityRef.current === key) return;
    prevCityRef.current = key;
    try {
      mapInstance.current.flyTo([lat, lng], cityZoom || 11, { animate: true, duration: 1.2 });
    } catch (e) {
      console.warn("flyTo failed:", e);
    }
  }, [cityCenter, cityZoom, mapReady]);

  return <div ref={mapRef} className="w-full h-full" />;
}
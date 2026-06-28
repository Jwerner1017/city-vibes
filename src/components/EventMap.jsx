import React, { useEffect, useRef, useState } from "react";
import { CATEGORY_CONFIG } from "@/lib/constants";

export default function EventMap({ events, onEventTap, selectedId, cityCenter, cityZoom }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
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

    events.forEach(event => {
      if (!event.latitude || !event.longitude) return;
      const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
      const isSelected = event.id === selectedId;

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

      const marker = L.marker([event.latitude, event.longitude], { icon }).addTo(map);
      marker.on("click", () => onEventTap?.(event));
      markersRef.current.push(marker);
    });
  }, [events, selectedId, mapReady, onEventTap]);

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
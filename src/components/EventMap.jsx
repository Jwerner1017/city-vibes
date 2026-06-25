import React, { useEffect, useRef, useState } from "react";
import { LOUISVILLE_CENTER, DEFAULT_ZOOM, CATEGORY_CONFIG } from "@/lib/constants";

export default function EventMap({ events, onEventTap, selectedId }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: LOUISVILLE_CENTER,
      zoom: DEFAULT_ZOOM,
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

  return <div ref={mapRef} className="w-full h-full" />;
}
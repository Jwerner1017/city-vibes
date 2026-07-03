import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import EventCard from "@/components/EventCard";
import { ArrowLeft, Ghost, MapPin, Plus, Candy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { LOUISVILLE_CENTER } from "@/lib/constants";
import { useCity } from "@/lib/CityContext";

const distanceMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DECORATION_LEVELS = {
  none: "No Decorations",
  basic: "🎃 Basic",
  moderate: "👻 Moderate",
  all_out: "💀 All Out!",
  haunted: "🏚️ Haunted House Level!",
};

export default function HalloweenHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedCity } = useCity();
  const [events, setEvents] = useState([]);
  const [treatStops, setTreatStops] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [tab, setTab] = useState("events"); // events | treatmap
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const cityCenter = (selectedCity?.latitude && selectedCity?.longitude) ? [selectedCity.latitude, selectedCity.longitude] : LOUISVILLE_CENTER;
  const [newStop, setNewStop] = useState({
    address: "", latitude: cityCenter[0], longitude: cityCenter[1],
    candy_type: "", decorations: "basic", notes: "", year: new Date().getFullYear(),
  });

  useEffect(() => {
    const load = async () => {
      const [evs, stops] = await Promise.all([
        base44.entities.Event.filter({ status: "approved", holiday: "halloween" }, "-date_start", 200),
        base44.entities.TreatStop.filter({ is_active: true, year: new Date().getFullYear() }, "-created_date", 200),
      ]);
      const nearbyEvents = selectedCity?.latitude && selectedCity?.longitude
        ? evs.filter(e => e.latitude && e.longitude && distanceMiles(selectedCity.latitude, selectedCity.longitude, e.latitude, e.longitude) <= 50)
        : evs;
      const nearbyStops = selectedCity?.latitude && selectedCity?.longitude
        ? stops.filter(s => s.latitude && s.longitude && distanceMiles(selectedCity.latitude, selectedCity.longitude, s.latitude, s.longitude) <= 50)
        : stops;
      setEvents(nearbyEvents);
      setTreatStops(nearbyStops);
    };
    load();
  }, [selectedCity]);

  useEffect(() => {
    if (tab !== "treatmap" || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    if (!L) return;
    const map = L.map(mapRef.current, { center: cityCenter, zoom: 13, zoomControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [tab]);

  useEffect(() => {
    if (!mapInstance.current || tab !== "treatmap") return;
    const L = window.L;
    const map = mapInstance.current;

    treatStops.forEach(stop => {
      const decoEmoji = stop.decorations === "haunted" ? "🏚️" : stop.decorations === "all_out" ? "💀" : stop.decorations === "moderate" ? "👻" : "🎃";
      const icon = L.divIcon({
        className: "treat-marker",
        html: `<div style="font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));cursor:pointer;">${decoEmoji}</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15],
      });
      const marker = L.marker([stop.latitude, stop.longitude], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:Quicksand,sans-serif;min-width:150px;">
          <strong>${stop.address}</strong><br/>
          <span>🍬 ${stop.candy_type || "Candy"}</span><br/>
          <span>${DECORATION_LEVELS[stop.decorations] || ""}</span>
          ${stop.notes ? `<br/><em>${stop.notes}</em>` : ""}
        </div>
      `);
    });
  }, [treatStops, tab]);

  const initAddMap = () => {
    setTimeout(() => {
      const el = document.getElementById("add-treat-map");
      if (!el || markerRef.current) return;
      const L = window.L;
      const miniMap = L.map(el, { center: cityCenter, zoom: 14, zoomControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(miniMap);
      const marker = L.marker(cityCenter, { draggable: true }).addTo(miniMap);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setNewStop(s => ({ ...s, latitude: p.lat, longitude: p.lng }));
      });
      miniMap.on("click", e => {
        marker.setLatLng(e.latlng);
        setNewStop(s => ({ ...s, latitude: e.latlng.lat, longitude: e.latlng.lng }));
      });
      markerRef.current = { map: miniMap, marker };
    }, 300);
  };

  const submitTreatStop = async () => {
    if (!newStop.address) { toast({ title: "Please add your address", variant: "destructive" }); return; }
    await base44.entities.TreatStop.create({ ...newStop, is_active: true });
    toast({ title: "Your house is on the Treat Map! 🎃" });
    setShowAddForm(false);
    markerRef.current = null;
    const stops = await base44.entities.TreatStop.filter({ is_active: true, year: new Date().getFullYear() }, "-created_date", 200);
    setTreatStops(stops);
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="relative h-44 bg-gradient-to-br from-orange-500 to-orange-700">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-5xl">🎃</span>
            <h1 className="font-heading font-black text-2xl text-white mt-1">Halloween Hub</h1>
            <p className="text-white/80 text-xs">Louisville's spookiest events & Treat Map</p>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-border sticky top-0 z-20">
        <button onClick={() => setTab("events")} className={`flex-1 py-3 text-sm font-bold font-heading transition-all ${tab === "events" ? "text-orange-600 border-b-2 border-orange-500" : "text-muted-foreground"}`}>
          👻 Events
        </button>
        <button onClick={() => setTab("treatmap")} className={`flex-1 py-3 text-sm font-bold font-heading transition-all ${tab === "treatmap" ? "text-orange-600 border-b-2 border-orange-500" : "text-muted-foreground"}`}>
          🍬 Treat Map
        </button>
      </div>

      {tab === "events" ? (
        <div className="px-4 pt-4 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Ghost className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No Halloween events yet</p>
            </div>
          ) : events.map(e => <EventCard key={e.id} event={e} compact />)}
        </div>
      ) : (
        <div className="relative">
          <div ref={mapRef} className="h-[calc(100vh-240px)]" />
          <div className="absolute bottom-4 left-4 right-4 z-30">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-3 border border-border shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-heading font-bold text-sm">🍬 {treatStops.length} Treat Stops</p>
                <Sheet open={showAddForm} onOpenChange={(open) => { setShowAddForm(open); if (open) initAddMap(); else markerRef.current = null; }}>
                  <SheetTrigger asChild>
                    <Button size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600 gap-1">
                      <Plus className="w-4 h-4" /> Add My House
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="font-heading">🏠 Add Your House to Treat Map</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      <Input value={newStop.address} onChange={e => setNewStop(s => ({ ...s, address: e.target.value }))} placeholder="Your address" className="h-12 rounded-xl" />
                      <div id="add-treat-map" className="h-40 rounded-xl border border-border" />
                      <Input value={newStop.candy_type} onChange={e => setNewStop(s => ({ ...s, candy_type: e.target.value }))} placeholder="What candy are you giving out?" className="h-12 rounded-xl" />
                      <Select value={newStop.decorations} onValueChange={v => setNewStop(s => ({ ...s, decorations: v }))}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(DECORATION_LEVELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Textarea value={newStop.notes} onChange={e => setNewStop(s => ({ ...s, notes: e.target.value }))} placeholder="Any notes for families?" className="rounded-xl" />
                      <Button onClick={submitTreatStop} className="w-full h-12 rounded-full bg-orange-500 hover:bg-orange-600 font-heading font-bold">
                        Add to Treat Map 🎃
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <p className="text-[10px] text-muted-foreground">Tap a pin to see candy & decorations</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
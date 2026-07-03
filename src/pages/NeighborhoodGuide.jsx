import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MapPin } from "lucide-react";
import { useCity } from "@/lib/CityContext";
import NeighborhoodCard from "@/components/NeighborhoodCard";
import EventCard from "@/components/EventCard";
import BottomNav from "@/components/BottomNav";
import PullToRefresh from "@/components/PullToRefresh";

const distanceMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function NeighborhoodGuide() {
  const { selectedCity } = useCity();
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [nData, eData] = await Promise.all([
      base44.entities.Neighborhood.filter({ is_active: true }, "name", 200),
      base44.entities.Event.filter({ status: "approved" }, "date_start", 500),
    ]);

    let filteredNeighborhoods = nData;
    if (selectedCity?.name) {
      const cityMatches = nData.filter(n => n.city?.toLowerCase() === selectedCity.name.toLowerCase());
      filteredNeighborhoods = cityMatches.length > 0 ? cityMatches : nData;
    }

    setNeighborhoods(filteredNeighborhoods);
    setEvents(eData);
    setLoading(false);
  }, [selectedCity]);

  useEffect(() => { load(); }, [load]);

  const eventsForNeighborhood = useMemo(() => {
    const map = {};
    neighborhoods.forEach(n => {
      map[n.id] = events
        .filter(e => e.latitude && e.longitude)
        .filter(e => distanceMiles(n.latitude, n.longitude, e.latitude, e.longitude) <= (n.radius_miles || 3))
        .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
    });
    return map;
  }, [neighborhoods, events]);

  const selectedEvents = selected ? (eventsForNeighborhood[selected.id] || []) : [];

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/95 backdrop-blur-lg border-b border-white/10 z-20 safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/" className="p-1">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="font-heading font-black text-lg text-white">Neighborhood Guide</h1>
            <p className="text-white/50 text-xs">Explore events happening around {selectedCity?.name || "your city"}</p>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={load} className="px-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : neighborhoods.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No neighborhoods added yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
              {neighborhoods.map(n => (
                <NeighborhoodCard
                  key={n.id}
                  neighborhood={n}
                  eventCount={eventsForNeighborhood[n.id]?.length || 0}
                  selected={selected?.id === n.id}
                  onClick={() => setSelected(selected?.id === n.id ? null : n)}
                />
              ))}
            </div>

            {selected && (
              <div className="mt-6 max-w-4xl mx-auto">
                <h3 className="font-heading font-bold text-sm text-white mb-3">
                  Events in {selected.name}
                  <span className="text-white/40 font-normal ml-2">{selectedEvents.length}</span>
                </h3>
                {selectedEvents.length === 0 ? (
                  <div className="text-center py-10 text-white/40">
                    <p className="text-sm">No upcoming events in this neighborhood yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEvents.map(event => <EventCard key={event.id} event={event} compact />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </PullToRefresh>

      <BottomNav />
    </div>
  );
}
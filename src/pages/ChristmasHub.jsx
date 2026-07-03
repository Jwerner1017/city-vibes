import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import EventCard from "@/components/EventCard";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCity } from "@/lib/CityContext";

const distanceMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function ChristmasHub() {
  const navigate = useNavigate();
  const { selectedCity } = useCity();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    base44.entities.Event.filter({ status: "approved", holiday: "christmas" }, "-date_start", 200)
      .then(evs => {
        const nearby = selectedCity?.latitude && selectedCity?.longitude
          ? evs.filter(e => e.latitude && e.longitude && distanceMiles(selectedCity.latitude, selectedCity.longitude, e.latitude, e.longitude) <= 50)
          : evs;
        setEvents(nearby);
      });
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="relative h-44 bg-gradient-to-br from-red-600 to-red-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-5xl">🎄</span>
            <h1 className="font-heading font-black text-2xl text-white mt-1">Christmas Hub</h1>
            <p className="text-white/80 text-xs">Santa photos, lights, markets & more</p>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Santa Trackers */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <h2 className="font-heading font-bold text-base mb-3">🎅 Track Santa!</h2>
          <div className="space-y-2">
            <a
              href="https://www.noradsanta.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <p className="font-bold text-sm">NORAD Santa Tracker</p>
                  <p className="text-[10px] text-muted-foreground">Official military tracking</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
            <a
              href="https://santatracker.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🗺️</span>
                <div>
                  <p className="font-bold text-sm">Google Santa Tracker</p>
                  <p className="text-[10px] text-muted-foreground">Games, activities & tracking</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Christmas Events */}
        <div>
          <h2 className="font-heading font-bold text-base mb-3">🎄 Christmas Events</h2>
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <span className="text-4xl block mb-3">🎄</span>
              <p>No Christmas events yet — stay tuned!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(e => <EventCard key={e.id} event={e} compact />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
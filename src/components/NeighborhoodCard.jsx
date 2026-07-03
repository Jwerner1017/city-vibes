import React from "react";
import { MapPin, CalendarDays, ChevronRight } from "lucide-react";

export default function NeighborhoodCard({ neighborhood, eventCount, onClick, selected }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl overflow-hidden border transition-all ${
        selected ? "border-primary shadow-lg shadow-primary/20" : "border-white/10 hover:border-white/20"
      } bg-gray-900`}
    >
      <div className="relative h-28 bg-muted">
        {neighborhood.image_url ? (
          <img src={neighborhood.image_url} alt={neighborhood.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
            <MapPin className="w-8 h-8 text-white/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <h3 className="font-heading font-bold text-white text-sm">{neighborhood.name}</h3>
          <ChevronRight className="w-4 h-4 text-white/70" />
        </div>
      </div>
      <div className="p-3 flex items-center justify-between">
        <p className="text-white/50 text-xs line-clamp-1 flex-1 pr-2">{neighborhood.description}</p>
        <span className="flex items-center gap-1 text-xs font-semibold text-primary flex-shrink-0">
          <CalendarDays className="w-3 h-3" />
          {eventCount}
        </span>
      </div>
    </button>
  );
}
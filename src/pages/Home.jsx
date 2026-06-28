import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import EventMap from "@/components/EventMap";
import EventCard from "@/components/EventCard";
import FilterBar from "@/components/FilterBar";
import BottomNav from "@/components/BottomNav";
import CreateEventFAB from "@/components/CreateEventFAB";
import RecommendedEvents from "@/components/RecommendedEvents";
import { MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const query = { status: "approved" };
    if (filters.category) query.category = filters.category;
    if (filters.holiday) query.holiday = filters.holiday;
    if (filters.is_free === true) query.is_free = true;
    if (filters.is_free === false) query.is_free = false;

    const data = await base44.entities.Event.filter(query, "-date_start", 100);
    let filtered = data;

    if (filters.age_range) {
      filtered = filtered.filter(e =>
        e.age_min <= filters.age_range.max && e.age_max >= filters.age_range.min
      );
    }

    setEvents(filtered);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-border z-20 relative">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div>
            <h1 className="font-heading font-black text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Local Vibes
            </h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>Louisville, KY</span>
            </div>
          </div>
        </div>
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <EventMap
            events={events}
            selectedId={selectedEvent?.id}
            onEventTap={setSelectedEvent}
          />
        )}

        {/* Selected event card */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-20 left-4 right-4 z-30"
            >
              <div className="relative">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute -top-2 -right-2 z-10 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <EventCard event={selectedEvent} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommended for You */}
        {!selectedEvent && (
          <RecommendedEvents allEvents={events} onEventTap={setSelectedEvent} />
        )}
      </div>

      <CreateEventFAB />
      <BottomNav />
    </div>
  );
}
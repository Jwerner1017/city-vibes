import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import EventMap from "@/components/EventMap";
import EventCard from "@/components/EventCard";
import FilterBar from "@/components/FilterBar";
import BottomNav from "@/components/BottomNav";
import CreateEventFAB from "@/components/CreateEventFAB";
import SponsorCard from "@/components/SponsorCard";
import BecomeSponsorModal from "@/components/BecomeSponsorModal";
import { Map, CalendarDays, List, ChevronLeft, ChevronRight, X, Store, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import CitySelector from "@/components/CitySelector";
import { useCity } from "@/lib/CityContext";
import PullToRefresh from "@/components/PullToRefresh";

const VIEW_TABS = [
  { id: "map", icon: Map, label: "Map" },
  { id: "calendar", icon: CalendarDays, label: "Calendar" },
  { id: "list", icon: List, label: "List" },
];

export default function Home() {
  const { selectedCity } = useCity();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState("map");

  // Sponsor state
  const [sponsors, setSponsors] = useState([]);
  const [showSponsors, setShowSponsors] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [showSponsorModal, setShowSponsorModal] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(null);

  // Haversine distance in miles
  const distanceMiles = (lat1, lng1, lat2, lng2) => {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const query = { status: "approved" };
    if (filters.category) query.category = filters.category;
    if (filters.holiday) query.holiday = filters.holiday;
    if (filters.is_free === true) query.is_free = true;
    if (filters.is_free === false) query.is_free = false;

    // Narrow down at the database level to a bounding box around the selected city,
    // so events aren't squeezed out by the global result cap as more cities get synced.
    if (selectedCity?.latitude && selectedCity?.longitude) {
      const latDelta = 50 / 69; // ~50 miles in degrees latitude
      const lngDelta = 50 / (69 * Math.cos(selectedCity.latitude * Math.PI / 180));
      query.latitude = { $gte: selectedCity.latitude - latDelta, $lte: selectedCity.latitude + latDelta };
      query.longitude = { $gte: selectedCity.longitude - lngDelta, $lte: selectedCity.longitude + lngDelta };
    }

    const data = await base44.entities.Event.filter(query, "date_start", 500);
    let filtered = data;

    if (filters.age_range) {
      filtered = filtered.filter(e =>
        e.age_min <= filters.age_range.max && e.age_max >= filters.age_range.min
      );
    }

    // Precise filter to events within exactly 50 miles of selected city
    if (selectedCity?.latitude && selectedCity?.longitude) {
      filtered = filtered.filter(e => {
        if (!e.latitude || !e.longitude) return false;
        return distanceMiles(selectedCity.latitude, selectedCity.longitude, e.latitude, e.longitude) <= 50;
      });
    }

    setEvents(filtered);
    setLoading(false);
  }, [filters, selectedCity]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Load sponsors near selected city
  useEffect(() => {
    const loadSponsors = async () => {
      try {
        const all = await base44.entities.Sponsor.filter({ status: "active" }, "-tier", 100);
        if (selectedCity?.latitude && selectedCity?.longitude) {
          const nearby = all.filter(s => {
            if (!s.latitude || !s.longitude) return false;
            return distanceMiles(selectedCity.latitude, selectedCity.longitude, s.latitude, s.longitude) <= 50;
          });
          setSponsors(nearby);
        } else {
          setSponsors(all);
        }
      } catch {
        setSponsors([]);
      }
    };
    loadSponsors();
  }, [selectedCity]);

  // Calendar helpers
  const daysInMonth = currentMonth.daysInMonth();
  const startDay = moment(currentMonth).startOf("month").day();
  const today = moment().format("YYYY-MM-DD");
  const getEventsForDate = (dateStr) => events.filter(e => moment(e.date_start).format("YYYY-MM-DD") === dateStr);
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const upcomingEvents = events
    .filter(e => moment(e.date_start).isSameOrAfter(moment(), "day"))
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-border z-20 relative safe-top">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div>
            <h1 className="font-heading font-black text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              City Vibes
            </h1>
            <CitySelector />
          </div>

          {/* 3-way toggle */}
          <div className="flex items-center bg-muted rounded-full p-0.5 gap-0.5">
            {VIEW_TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* MAP VIEW */}
            {viewMode === "map" && (
              <div className="absolute inset-0">
                <EventMap
                  events={events}
                  sponsors={showSponsors ? sponsors : []}
                  selectedId={selectedEvent?.id}
                  selectedSponsorId={selectedSponsor?.id}
                  onEventTap={(e) => { setSelectedSponsor(null); setSelectedEvent(e); }}
                  onSponsorTap={(s) => { setSelectedEvent(null); setSelectedSponsor(s); }}
                  cityCenter={(selectedCity && isFinite(selectedCity.latitude) && isFinite(selectedCity.longitude)) ? [selectedCity.latitude, selectedCity.longitude] : null}
                  cityZoom={selectedCity?.zoom || 11}
                />

                {/* Sponsor layer toggle + Become a Sponsor button */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
                  <button
                    onClick={() => setShowSponsors(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold shadow-lg transition-all ${
                      showSponsors
                        ? "bg-amber-500 text-white"
                        : "bg-white/90 text-gray-500"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    {showSponsors ? `${sponsors.length} Sponsors` : "Sponsors Off"}
                  </button>

                  <button
                    onClick={() => setShowSponsorModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold shadow-lg bg-gradient-to-r from-primary to-accent text-white"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Become a Sponsor
                  </button>
                </div>

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

                {/* Selected sponsor card */}
                <AnimatePresence>
                  {selectedSponsor && (
                    <motion.div
                      initial={{ y: 200, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 200, opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute bottom-20 left-4 right-4 z-30"
                    >
                      <div className="relative">
                        <button
                          onClick={() => setSelectedSponsor(null)}
                          className="absolute -top-2 -right-2 z-10 w-7 h-7 bg-gray-900 border border-white/20 rounded-full shadow-md flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        <SponsorCard sponsor={selectedSponsor} onClose={() => setSelectedSponsor(null)} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* CALENDAR VIEW */}
            {viewMode === "calendar" && (
              <div className="h-full overflow-y-auto pb-24 px-4 pt-4" style={{ overscrollBehavior: "none" }}>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCurrentMonth(moment(currentMonth).subtract(1, "month"))} className="p-2 rounded-full hover:bg-muted">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="font-heading font-bold text-lg">{currentMonth.format("MMMM YYYY")}</h2>
                  <button onClick={() => setCurrentMonth(moment(currentMonth).add(1, "month"))} className="p-2 rounded-full hover:bg-muted">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["S","M","T","W","T","F","S"].map((d, i) => (
                    <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = currentMonth.format("YYYY-MM-") + String(day).padStart(2, "0");
                    const dayEvents = getEventsForDate(dateStr);
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm transition-all ${
                          isSelected ? "bg-primary text-white shadow-md" : isToday ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                        }`}
                      >
                        <span className={`font-medium ${isSelected ? "font-bold" : ""}`}>{day}</span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5">
                            {dayEvents.slice(0, 3).map((e, idx) => (
                              <span key={idx} className="w-1.5 h-1.5 rounded-full" style={{
                                backgroundColor: isSelected ? "white" : (
                                  idx === 0 ? "hsl(var(--primary))" : idx === 1 ? "hsl(var(--secondary))" : "hsl(var(--accent))"
                                )
                              }} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && (
                  <div className="mt-6">
                    <h3 className="font-heading font-bold text-sm mb-3">
                      {moment(selectedDate).format("dddd, MMMM D")}
                      <span className="text-muted-foreground font-normal ml-2">{selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""}</span>
                    </h3>
                    {selectedDateEvents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No events on this day</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDateEvents.map(event => <EventCard key={event.id} event={event} compact />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
              <PullToRefresh onRefresh={loadEvents} className="h-full pb-24 px-4 pt-4">
                <h3 className="font-heading font-bold text-sm mb-3">
                  Upcoming Events
                  <span className="text-muted-foreground font-normal ml-2">{upcomingEvents.length}</span>
                </h3>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map(event => <EventCard key={event.id} event={event} compact />)}
                  </div>
                )}
              </PullToRefresh>
            )}
          </>
        )}
      </div>

      <CreateEventFAB />
      <BottomNav />

      {/* Become a Sponsor modal */}
      <AnimatePresence>
        {showSponsorModal && (
          <BecomeSponsorModal onClose={() => setShowSponsorModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
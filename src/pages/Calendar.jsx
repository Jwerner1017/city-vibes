import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import EventCard from "@/components/EventCard";
import FilterBar from "@/components/FilterBar";
import BottomNav from "@/components/BottomNav";
import CreateEventFAB from "@/components/CreateEventFAB";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import moment from "moment";

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(null);
  const loadEvents = useCallback(async () => {
    setLoading(true);
    const query = { status: "approved" };
    if (filters.category) query.category = filters.category;
    if (filters.holiday) query.holiday = filters.holiday;
    if (filters.is_free === true) query.is_free = true;
    if (filters.is_free === false) query.is_free = false;

    const data = await base44.entities.Event.filter(query, "date_start", 200);
    let filtered = data;
    if (filters.age_range) {
      filtered = filtered.filter(e =>
        e.age_min <= filters.age_range.max && e.age_max >= filters.age_range.min
      );
    }
    setEvents(filtered);
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const daysInMonth = currentMonth.daysInMonth();
  const startDay = moment(currentMonth).startOf("month").day();
  const today = moment().format("YYYY-MM-DD");

  const getEventsForDate = (dateStr) =>
    events.filter(e => moment(e.date_start).format("YYYY-MM-DD") === dateStr);

  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate)
    : [];

  const prevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, "month"));
  const nextMonth = () => setCurrentMonth(moment(currentMonth).add(1, "month"));

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-border z-20">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <h1 className="font-heading font-black text-xl">Calendar</h1>
          <CalendarDays className="w-5 h-5 text-muted-foreground" />
        </div>
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-4 pt-4">
            {/* Month navigator */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 rounded-full hover:bg-muted">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-heading font-bold text-lg">
                {currentMonth.format("MMMM YYYY")}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-full hover:bg-muted">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
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
                      isSelected
                        ? "bg-primary text-white shadow-md"
                        : isToday
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className={`font-medium ${isSelected ? "font-bold" : ""}`}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5">
                        {dayEvents.slice(0, 3).map((e, idx) => (
                          <span
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: isSelected ? "white" : (
                                idx === 0 ? "hsl(var(--primary))" :
                                idx === 1 ? "hsl(var(--secondary))" : "hsl(var(--accent))"
                              ),
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected date events */}
            {selectedDate && (
              <div className="mt-6">
                <h3 className="font-heading font-bold text-sm mb-3">
                  {moment(selectedDate).format("dddd, MMMM D")}
                  <span className="text-muted-foreground font-normal ml-2">
                    {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""}
                  </span>
                </h3>
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No events on this day</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateEvents.map(event => (
                      <EventCard key={event.id} event={event} compact />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateEventFAB />
      <BottomNav />
    </div>
  );
}
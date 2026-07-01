import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Search, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import moment from "moment";
import BottomNav from "@/components/BottomNav";
import EventReviews from "@/components/EventReviews";

export default function EventReviewsPage() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [evs, me] = await Promise.all([
        base44.entities.Event.filter({ status: "approved" }, "-date_start", 200),
        base44.auth.me().catch(() => null),
      ]);
      setEvents(evs);
      setUser(me);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return events.filter(e => (q ? e.title.toLowerCase().includes(q) : true));
  }, [events, query]);

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="sticky top-0 bg-gray-950/95 backdrop-blur-lg border-b border-white/10 z-20 safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/" className="p-1">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="font-heading font-black text-lg text-white">Event Reviews</h1>
            <p className="text-white/50 text-xs">See what families think — or share your own experience</p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search events..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No events found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(event => {
              const isOpen = expandedId === event.id;
              return (
                <div key={event.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : event.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{event.title}</p>
                      <p className="text-xs text-white/50">
                        {moment(event.date_start).format("MMM D, YYYY")}
                        {event.location_name ? ` • ${event.location_name}` : ""}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-white/50 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="bg-background px-4 pb-4">
                      <EventReviews eventId={event.id} user={user} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
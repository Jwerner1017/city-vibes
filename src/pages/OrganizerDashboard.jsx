import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CATEGORY_CONFIG } from "@/lib/constants";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Users, Heart, Eye, TrendingUp, Calendar, BarChart3, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "18" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-heading font-black">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function EventRow({ event, goingCount, savedCount }) {
  const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
  return (
    <Link to={`/event/${event.id}`} className="block bg-white rounded-2xl border border-border p-4 active:scale-[0.99] transition-transform">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: cat.color + "18" }}>
          {cat.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm leading-tight truncate">{event.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{moment(event.date_start).format("MMM D, YYYY")}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              className="text-[10px] border-0 font-semibold px-2 py-0"
              style={{ backgroundColor: cat.color + "20", color: cat.color }}
            >
              {cat.label}
            </Badge>
            {event.status === "pending" && (
              <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px]">Pending</Badge>
            )}
            {event.status === "approved" && (
              <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Approved</Badge>
            )}
            {event.status === "rejected" && (
              <Badge className="bg-red-100 text-red-600 border-0 text-[10px]">Rejected</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-primary">
            <Users className="w-3.5 h-3.5" />
            <span className="font-bold text-sm">{goingCount}</span>
          </div>
          <div className="flex items-center gap-1 text-rose-500">
            <Heart className="w-3.5 h-3.5" />
            <span className="font-bold text-sm">{savedCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        // Load events created by this user
        const myEvents = await base44.entities.Event.filter({ created_by_id: me.id }, "-date_start", 100);
        setEvents(myEvents);

        if (myEvents.length > 0) {
          // Load all interactions for these events in one batch using $in
          const eventIds = myEvents.map(e => e.id);
          const allInteractions = await base44.asServiceRole?.entities?.UserInteraction
            ? base44.asServiceRole.entities.UserInteraction.filter({ event_id: { $in: eventIds } })
            : Promise.resolve([]);
          setInteractions(await allInteractions);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const getCount = (eventId, type) =>
    interactions.filter(i => i.event_id === eventId && i.type === type).length;

  const totalGoing = interactions.filter(i => i.type === "going").length;
  const totalSaved = interactions.filter(i => i.type === "saved").length;
  const approvedCount = events.filter(e => e.status === "approved").length;

  // Sort by engagement
  const sortedEvents = [...events].sort(
    (a, b) => (getCount(b.id, "going") + getCount(b.id, "saved")) - (getCount(a.id, "going") + getCount(a.id, "saved"))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-accent px-4 pt-10 pb-14">
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-white/80" />
          <p className="text-white/80 text-sm font-semibold">Organizer Dashboard</p>
        </div>
        <h1 className="font-heading font-black text-2xl text-white">Your Events</h1>
        <p className="text-white/70 text-xs mt-0.5">Track engagement across all your submissions</p>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Calendar} label="Events" value={events.length} color="#3b82f6" />
          <StatCard icon={Users} label="Going" value={totalGoing} color="#10b981" />
          <StatCard icon={Heart} label="Saved" value={totalSaved} color="#f43f5e" />
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="font-heading font-bold text-base">No events yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Submit your first event to start tracking engagement.</p>
            <Link
              to="/create-event"
              className="inline-flex items-center gap-2 bg-primary text-white font-heading font-bold text-sm px-5 py-2.5 rounded-full"
            >
              <Plus className="w-4 h-4" /> Create Event
            </Link>
          </div>
        ) : (
          <>
            {/* Engagement breakdown */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-heading font-bold text-sm">Engagement Overview</h2>
              </div>
              <div className="space-y-2">
                {sortedEvents.slice(0, 3).map(ev => {
                  const going = getCount(ev.id, "going");
                  const saved = getCount(ev.id, "saved");
                  const total = going + saved;
                  const maxTotal = Math.max(
                    ...sortedEvents.slice(0, 3).map(e => getCount(e.id, "going") + getCount(e.id, "saved")),
                    1
                  );
                  return (
                    <div key={ev.id}>
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-semibold truncate max-w-[60%]">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{going}👤 {saved}❤️</p>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                          style={{ width: `${(total / maxTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All events list */}
            <div>
              <h2 className="font-heading font-bold text-sm mb-2 px-1">All Your Events</h2>
              <div className="space-y-3">
                {sortedEvents.map(ev => (
                  <EventRow
                    key={ev.id}
                    event={ev}
                    goingCount={getCount(ev.id, "going")}
                    savedCount={getCount(ev.id, "saved")}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
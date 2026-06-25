import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import EventCard from "@/components/EventCard";
import BottomNav from "@/components/BottomNav";
import { Heart, Bookmark, Users } from "lucide-react";

export default function Saved() {
  const [tab, setTab] = useState("saved");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const interactions = await base44.entities.UserInteraction.filter({ type: tab });
      if (interactions.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }
      const allEvents = await base44.entities.Event.filter({ status: "approved" }, "-date_start", 200);
      const interactionIds = new Set(interactions.map(i => i.event_id));
      setEvents(allEvents.filter(e => interactionIds.has(e.id)));
      setLoading(false);
    };
    load();
  }, [tab]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white/95 backdrop-blur-lg border-b border-border sticky top-0 z-20">
        <div className="px-4 pt-3 pb-1">
          <h1 className="font-heading font-black text-xl">My Events</h1>
        </div>
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("saved")}
            className={`flex-1 py-2.5 text-sm font-bold font-heading flex items-center justify-center gap-1.5 transition-all ${
              tab === "saved" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            <Heart className="w-4 h-4" /> Saved
          </button>
          <button
            onClick={() => setTab("going")}
            className={`flex-1 py-2.5 text-sm font-bold font-heading flex items-center justify-center gap-1.5 transition-all ${
              tab === "going" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            <Users className="w-4 h-4" /> Going
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            {tab === "saved" ? (
              <>
                <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No saved events yet</p>
                <p className="text-xs text-muted-foreground mt-1">Tap the heart on any event to save it</p>
              </>
            ) : (
              <>
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">You're not going to any events yet</p>
                <p className="text-xs text-muted-foreground mt-1">Tap "I'm Going" on any event</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
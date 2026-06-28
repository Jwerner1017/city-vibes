import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { Sparkles, ChevronUp, ChevronDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import moment from "moment";

function scoreEvents(allEvents, interactions) {
  // Build category frequency map from past interactions
  const interactedIds = new Set(interactions.map(i => i.event_id));
  const categoryScores = {};

  interactions.forEach(interaction => {
    const ev = allEvents.find(e => e.id === interaction.event_id);
    if (!ev) return;
    const weight = interaction.type === "going" ? 3 : 2; // going > saved
    categoryScores[ev.category] = (categoryScores[ev.category] || 0) + weight;
  });

  // Score remaining events by category affinity, recency, and free bonus
  const now = moment();
  return allEvents
    .filter(e => !interactedIds.has(e.id) && e.status === "approved")
    .map(ev => {
      let score = categoryScores[ev.category] || 0;
      // Prefer upcoming events (within 30 days)
      const daysAway = moment(ev.date_start).diff(now, "days");
      if (daysAway >= 0 && daysAway <= 7) score += 4;
      else if (daysAway >= 0 && daysAway <= 30) score += 2;
      if (ev.is_free) score += 1;
      if (ev.featured) score += 2;
      return { ...ev, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 8);
}

function EventPill({ event, onTap }) {
  const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
  return (
    <Link
      to={`/event/${event.id}`}
      className="flex-shrink-0 w-48 bg-white rounded-2xl border border-border shadow-sm overflow-hidden active:scale-95 transition-transform"
    >
      <div
        className="h-24 flex items-center justify-center text-4xl"
        style={{ backgroundColor: cat.color + "18" }}
      >
        {event.photos?.[0]
          ? <img src={event.photos[0]} alt="" className="w-full h-full object-cover" />
          : cat.emoji}
      </div>
      <div className="p-2">
        <p className="font-heading font-bold text-xs leading-tight line-clamp-2">{event.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{moment(event.date_start).format("MMM D")}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
            {cat.label}
          </span>
          {event.is_free && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Free</span>}
        </div>
      </div>
    </Link>
  );
}

export default function RecommendedEvents({ allEvents, onEventTap }) {
  const [user, setUser] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const interactions = await base44.entities.UserInteraction.filter({});
        const scored = scoreEvents(allEvents, interactions);
        setRecommended(scored);
      } catch {
        // not logged in — show featured/free events as fallback
        const fallback = allEvents
          .filter(e => e.status === "approved" && (e.featured || e.is_free))
          .sort((a, b) => moment(a.date_start).diff(moment(b.date_start)))
          .slice(0, 8);
        setRecommended(fallback);
      }
      setLoading(false);
    };
    if (allEvents.length > 0) load();
  }, [allEvents]);

  if (loading || recommended.length === 0) return null;

  return (
    <div
      className={`absolute left-0 right-0 z-20 transition-all duration-300 ${expanded ? "bottom-16" : "bottom-16"}`}
    >
      {/* Handle / header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mx-4 w-auto flex items-center gap-2 bg-white/95 backdrop-blur-md border border-border rounded-t-2xl px-4 py-2 shadow-lg w-full"
        style={{ borderBottom: expanded ? "none" : undefined }}
      >
        <Sparkles className="w-4 h-4 text-secondary flex-shrink-0" />
        <span className="font-heading font-bold text-sm flex-1 text-left">
          {user ? "Recommended for You" : "Featured Events"}
        </span>
        <span className="text-xs text-muted-foreground mr-1">{recommended.length} picks</span>
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Scrollable cards */}
      {expanded && (
        <div className="mx-4 bg-white/95 backdrop-blur-md border border-t-0 border-border rounded-b-2xl shadow-lg px-3 pb-3 pt-2">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto no-scrollbar pb-1"
          >
            {recommended.map(ev => (
              <EventPill key={ev.id} event={ev} onTap={onEventTap} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
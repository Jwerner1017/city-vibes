import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BottomNav from "@/components/BottomNav";
import EventCard from "@/components/EventCard";
import PullToRefresh from "@/components/PullToRefresh";
import { HOLIDAY_CONFIG } from "@/lib/constants";
import { ChevronRight, ExternalLink } from "lucide-react";

const HOLIDAY_HUBS = [
  {
    key: "july_4th",
    title: "July 4th Fireworks",
    description: "Find the best fireworks shows and Independence Day celebrations across Louisville.",
    image: "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=800&h=400&fit=crop",
  },
  {
    key: "halloween",
    title: "Halloween",
    description: "Trick-or-treating, haunted houses, pumpkin patches, and our famous Treat Map!",
    image: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800&h=400&fit=crop",
    link: "/holidays/halloween",
  },
  {
    key: "christmas",
    title: "Christmas",
    description: "Santa photos, holiday lights, markets, and more. Plus links to NORAD & Google Santa Trackers!",
    image: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=800&h=400&fit=crop",
    link: "/holidays/christmas",
  },
  {
    key: "easter",
    title: "Easter",
    description: "Egg hunts, bunny visits, and spring festivals for the whole family.",
    image: "https://media.base44.com/images/public/6a3db61e02b6098cdc0ccc48/374b500c5_generated_image.png",
  },
  {
    key: "st_patricks",
    title: "St. Patrick's Day",
    description: "Parades, green festivities, and family-friendly celebrations.",
    image: "https://media.base44.com/images/public/6a3db61e02b6098cdc0ccc48/2e766514a_generated_image.png",
  },
  {
    key: "thanksgiving",
    title: "Thanksgiving",
    description: "Turkey trots, volunteer events, and family gatherings around Louisville.",
    image: "https://media.base44.com/images/public/6a3db61e02b6098cdc0ccc48/ab00fd2aa_generated_image.png",
  },
];

export default function Holidays() {
  const [holidayEvents, setHolidayEvents] = useState({});

  const loadHolidays = useCallback(async () => {
    const events = await base44.entities.Event.filter({ status: "approved" }, "-date_start", 200);
    const grouped = {};
    events.forEach(e => {
      if (e.holiday && e.holiday !== "none") {
        if (!grouped[e.holiday]) grouped[e.holiday] = [];
        grouped[e.holiday].push(e);
      }
    });
    setHolidayEvents(grouped);
  }, []);

  useEffect(() => { loadHolidays(); }, [loadHolidays]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white/95 backdrop-blur-lg border-b border-border sticky top-0 z-20 safe-top">
        <div className="px-4 pt-3 pb-3">
          <h1 className="font-heading font-black text-xl">Holiday Hubs 🎉</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Seasonal events & celebrations</p>
        </div>
      </div>

      <PullToRefresh onRefresh={loadHolidays} className="px-4 pt-4 space-y-4">
        {HOLIDAY_HUBS.map(hub => {
          const config = HOLIDAY_CONFIG[hub.key];
          const events = holidayEvents[hub.key] || [];
          return (
            <div key={hub.key} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="relative h-36">
                <img src={hub.image} alt={hub.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="font-heading font-black text-white text-lg flex items-center gap-2">
                    {config?.emoji} {hub.title}
                  </h2>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground">{hub.description}</p>
                {events.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {events.slice(0, 2).map(e => (
                      <EventCard key={e.id} event={e} compact />
                    ))}
                  </div>
                )}
                {hub.link ? (
                  <Link
                    to={hub.link}
                    className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-primary py-2"
                  >
                    Explore {hub.title} <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : events.length > 2 ? (
                  <Link
                    to={`/?holiday=${hub.key}`}
                    className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-primary py-2"
                  >
                    See all {events.length} events <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </PullToRefresh>

      <BottomNav />
    </div>
  );
}
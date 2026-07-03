import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Users, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_CONFIG } from "@/lib/constants";
import moment from "moment";

export default function EventCard({ event, compact = false }) {
  const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
  const rangeEnd = event.range_end || event.date_end;
  const isRange = event.is_running_event && rangeEnd && moment(rangeEnd).format("YYYY-MM-DD") !== moment(event.date_start).format("YYYY-MM-DD");
  const dateStr = isRange
    ? `${moment(event.date_start).format("MMM D")} – ${moment(rangeEnd).format("MMM D")}`
    : moment(event.date_start).format("MMM D");
  const timeStr = moment(event.date_start).format("h:mm A");
  const photo = event.photos?.[0];

  if (compact) {
    return (
      <Link to={`/event/${event.id}`} className="block">
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border hover:shadow-md transition-shadow">
          <div
            className="w-12 h-12 rounded-lg flex-shrink-0 bg-cover bg-center flex items-center justify-center"
            style={photo ? { backgroundImage: `url(${photo})` } : { backgroundColor: cat.color + "20" }}
          >
            {!photo && <span className="text-xl">{cat.emoji}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate font-heading">{event.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{dateStr} · {timeStr}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {event.is_free && (
              <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 border-0">
                Free
              </Badge>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/event/${event.id}`} className="block">
      <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all group">
        <div className="relative h-40 bg-muted">
          {photo ? (
            <img src={photo} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl" style={{ backgroundColor: cat.color + "15" }}>
              {cat.emoji}
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge className="text-[10px] text-white border-0" style={{ backgroundColor: cat.color }}>
              {cat.emoji} {cat.label}
            </Badge>
          </div>
          {event.is_free && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] bg-green-100 text-green-700 border-0 font-bold">
              FREE
            </Badge>
          )}
          {event.featured && (
            <div className="absolute bottom-2 left-2">
              <Badge className="text-[10px] bg-yellow-400 text-yellow-900 border-0">
                <Star className="w-3 h-3 mr-0.5 fill-current" /> Featured
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold font-heading text-sm leading-tight">{event.title}</h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{dateStr} · {timeStr}</span>
          </div>
          {event.location_name && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{event.location_name}</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {event.going_count > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {event.going_count}
                </span>
              )}
            </div>
            {!event.is_free && event.price_info && (
              <span className="text-xs font-semibold text-secondary">{event.price_info}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
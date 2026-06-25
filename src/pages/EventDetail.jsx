import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CATEGORY_CONFIG, HOLIDAY_CONFIG } from "@/lib/constants";
import { ArrowLeft, MapPin, Clock, Users, Heart, Share2, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState({ going: false, saved: false });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const ev = await base44.entities.Event.get(id);
      setEvent(ev);
      setLoading(false);
      try {
        const me = await base44.auth.me();
        setUser(me);
        const userInteractions = await base44.entities.UserInteraction.filter({ event_id: id });
        setInteractions({
          going: userInteractions.some(i => i.type === "going"),
          saved: userInteractions.some(i => i.type === "saved"),
        });
      } catch {}
    };
    load();
  }, [id]);

  const toggleInteraction = async (type) => {
    if (!user) {
      toast({ title: "Sign in to interact with events" });
      return;
    }
    const existing = await base44.entities.UserInteraction.filter({ event_id: id, type });
    if (existing.length > 0) {
      await base44.entities.UserInteraction.delete(existing[0].id);
      setInteractions(prev => ({ ...prev, [type]: false }));
      if (type === "going") {
        await base44.entities.Event.update(id, { going_count: Math.max(0, (event.going_count || 0) - 1) });
        setEvent(prev => ({ ...prev, going_count: Math.max(0, (prev.going_count || 0) - 1) }));
      }
    } else {
      await base44.entities.UserInteraction.create({ event_id: id, type });
      setInteractions(prev => ({ ...prev, [type]: true }));
      if (type === "going") {
        await base44.entities.Event.update(id, { going_count: (event.going_count || 0) + 1 });
        setEvent(prev => ({ ...prev, going_count: (prev.going_count || 0) + 1 }));
      }
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-lg font-heading font-bold">Event not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
  const holiday = event.holiday && event.holiday !== "none" ? HOLIDAY_CONFIG[event.holiday] : null;
  const photo = event.photos?.[0];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Hero */}
      <div className="relative h-64">
        {photo ? (
          <img src={photo} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl" style={{ backgroundColor: cat.color + "20" }}>
            {cat.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex gap-2 mb-2 flex-wrap">
            <Badge style={{ backgroundColor: cat.color }} className="text-white border-0 text-xs">
              {cat.emoji} {cat.label}
            </Badge>
            {holiday && (
              <Badge style={{ backgroundColor: holiday.color }} className="text-white border-0 text-xs">
                {holiday.emoji} {holiday.label}
              </Badge>
            )}
            {event.is_free && (
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">Free</Badge>
            )}
            {event.is_permanent && (
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Permanent</Badge>
            )}
          </div>
          <h1 className="font-heading font-black text-xl leading-tight">{event.title}</h1>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{moment(event.date_start).format("dddd, MMMM D, YYYY")}</p>
                <p className="text-xs text-muted-foreground">
                  {moment(event.date_start).format("h:mm A")}
                  {event.date_end && ` — ${moment(event.date_end).format("h:mm A")}`}
                </p>
              </div>
            </div>

            {(event.location_name || event.address) && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  {event.location_name && <p className="font-semibold text-sm">{event.location_name}</p>}
                  {event.address && <p className="text-xs text-muted-foreground">{event.address}</p>}
                </div>
              </div>
            )}

            {!event.is_free && event.price_info && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Admission</p>
                  <p className="text-xs text-muted-foreground">{event.price_info}</p>
                </div>
              </div>
            )}

            {(event.age_min !== undefined || event.age_max !== undefined) && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👶</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Ages {event.age_min || 0}–{event.age_max || 18}</p>
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="font-heading font-bold text-sm mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.website_url && (
            <a
              href={event.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 text-sm text-accent font-semibold"
            >
              <ExternalLink className="w-4 h-4" /> Visit Website
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => toggleInteraction("going")}
            className={`flex-1 rounded-full h-12 font-heading font-bold text-base gap-2 ${
              interactions.going ? "bg-primary" : "bg-white text-foreground border border-border hover:bg-muted"
            }`}
          >
            <Users className="w-5 h-5" />
            {interactions.going ? "Going!" : "I'm Going"}
            {event.going_count > 0 && <span className="text-xs opacity-75">({event.going_count})</span>}
          </Button>
          <Button
            onClick={() => toggleInteraction("saved")}
            variant="outline"
            className={`rounded-full h-12 w-12 p-0 ${interactions.saved ? "bg-red-50 border-red-200 text-red-500" : ""}`}
          >
            <Heart className={`w-5 h-5 ${interactions.saved ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
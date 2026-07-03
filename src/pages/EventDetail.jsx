import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CATEGORY_CONFIG, HOLIDAY_CONFIG } from "@/lib/constants";
import { ArrowLeft, MapPin, Clock, Users, Heart, Share2, ExternalLink, Calendar, CalendarPlus, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import EventReviews from "@/components/EventReviews";
import PhotoGallery from "@/components/PhotoGallery";
import UserBadges, { computeBadges } from "@/components/UserBadges";
import moment from "moment";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState({ going: false, saved: false });
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [gcalConnected, setGcalConnected] = useState(null); // null=unknown, true/false
  const [organizerBadges, setOrganizerBadges] = useState([]);

  const CONNECTOR_ID = "6a3ed7ba374b6378eae25755";

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
      // Load organizer badges
      if (ev?.created_by_id) {
        try {
          const [orgDonations, orgEvents] = await Promise.all([
            base44.entities.Donation.filter({ created_by_id: ev.created_by_id, status: "completed" }),
            base44.entities.Event.filter({ created_by_id: ev.created_by_id }),
          ]);
          setOrganizerBadges(computeBadges({ donationCount: orgDonations.length, eventCount: orgEvents.length }));
        } catch {}
      }
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

  const handleSyncToCalendar = async () => {
    if (!user) {
      toast({ title: "Sign in to sync events" });
      return;
    }
    if (gcalConnected === false) {
      // Connect Google Calendar first
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setGcalConnected(null); // reset so next click retries
        }
      }, 500);
      return;
    }
    setSyncing(true);
    try {
      await base44.functions.invoke("syncToGoogleCalendar", { event });
      toast({ title: "Added to Google Calendar! 🎉" });
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setGcalConnected(false);
        toast({ title: "Connect Google Calendar first", description: "Tap the button again to connect." });
      } else {
        toast({ title: "Failed to add to calendar", description: err?.response?.data?.error || err.message, variant: "destructive" });
      }
    }
    setSyncing(false);
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

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
  };

  const handleShareInstagram = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied! 📋", description: "Open Instagram and paste the link in your story or bio." });
  };

  const handleShareText = () => {
    const url = window.location.href;
    window.location.href = `sms:?&body=${encodeURIComponent(`${event.title} - ${url}`)}`;
  };

  const handleShareEmail = () => {
    const url = window.location.href;
    const subject = encodeURIComponent(event.title);
    const body = encodeURIComponent(`Check out this event: ${event.title}\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
  const hasPhotos = event.photos && event.photos.length > 0;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Hero / Gallery */}
      <div className="relative">
        {hasPhotos ? (
          <PhotoGallery photos={event.photos} title={event.title} />
        ) : (
          <div className="h-64 w-full flex items-center justify-center text-7xl" style={{ backgroundColor: cat.color + "20" }}>
            {cat.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-10"
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

          {organizerBadges.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-medium">Organizer:</span>
              <UserBadges badges={organizerBadges} size="sm" />
            </div>
          )}

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

        {/* Google Calendar sync */}
        <Button
          onClick={handleSyncToCalendar}
          disabled={syncing}
          variant="outline"
          className="w-full mt-3 rounded-full h-11 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <CalendarPlus className="w-4 h-4" />
          {syncing ? "Adding..." : gcalConnected === false ? "Connect Google Calendar" : "Add to Google Calendar"}
        </Button>

        {/* Reviews */}
        <EventReviews eventId={id} user={user} />

        {/* Social sharing */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">Share with friends & family</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={handleShareText}
              className="flex items-center justify-center gap-2 h-11 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Text
            </button>
            <button
              onClick={handleShareEmail}
              className="flex items-center justify-center gap-2 h-11 rounded-full border border-secondary/30 bg-secondary/5 hover:bg-secondary/10 text-secondary font-semibold text-sm transition-colors"
            >
              <Mail className="w-4 h-4" /> Email
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShareFacebook}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-[#1877F2]/30 bg-[#1877F2]/5 hover:bg-[#1877F2]/10 text-[#1877F2] font-semibold text-sm transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
            <button
              onClick={handleShareInstagram}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-[#E1306C]/30 bg-gradient-to-r from-[#f9ce34]/5 via-[#ee2a7b]/5 to-[#6228d7]/5 hover:from-[#f9ce34]/10 hover:via-[#ee2a7b]/10 hover:to-[#6228d7]/10 text-[#E1306C] font-semibold text-sm transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
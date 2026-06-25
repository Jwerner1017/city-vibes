import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Check, X, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

export default function Moderation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Event.filter({ status: "pending" }, "-created_date", 50)
      .then(data => { setEvents(data); setLoading(false); });
  }, []);

  const handleAction = async (id, status) => {
    await base44.entities.Event.update(id, { status });
    setEvents(events.filter(e => e.id !== id));
    toast({ title: status === "approved" ? "Event approved ✅" : "Event rejected" });
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-border z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-heading font-bold text-base">Moderation Queue</h1>
          <Badge variant="secondary" className="text-xs">{events.length}</Badge>
        </div>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="font-heading font-bold">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No events waiting for review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
              return (
                <div key={event.id} className="bg-white rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge style={{ backgroundColor: cat.color }} className="text-white border-0 text-[10px] mb-1">
                        {cat.emoji} {cat.label}
                      </Badge>
                      <h3 className="font-heading font-bold">{event.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-300">
                      <Clock className="w-3 h-3 mr-0.5" /> Pending
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{moment(event.date_start).format("MMM D, h:mm A")}</span>
                    {event.location_name && (
                      <>
                        <span>·</span>
                        <MapPin className="w-3 h-3" />
                        <span>{event.location_name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAction(event.id, "approved")}
                      className="flex-1 rounded-full h-10 gap-1.5 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </Button>
                    <Button
                      onClick={() => handleAction(event.id, "rejected")}
                      variant="outline"
                      className="flex-1 rounded-full h-10 gap-1.5 text-destructive border-destructive/20"
                    >
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
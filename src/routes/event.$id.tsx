import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Share2,
} from "lucide-react";
import { getEvent } from "@/lib/queries";
import { CATEGORY_CONFIG, HOLIDAY_CONFIG } from "@/lib/constants";
import { formatEventWhen, icsForEvent } from "@/lib/event-utils";
import { getSavedIds, subscribeSaved, toggleSaved } from "@/lib/saved";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/event/$id")({
  loader: async ({ params }) => {
    const event = await getEvent({ data: { id: Number(params.id) } });
    if (!event) throw notFound();
    return { event };
  },
  component: EventDetail,
  notFoundComponent: () => (
    <main className="px-6 py-16 text-center">
      <p className="font-display text-lg">That listing walked off.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-primary">
        Back to Discover
      </Link>
    </main>
  ),
});

function EventDetail() {
  const { event } = Route.useLoaderData();
  const cat = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.other;
  const Icon = cat.icon;
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(getSavedIds().includes(event.id));
    sync();
    return subscribeSaved(sync);
  }, [event.id]);

  const photo = event.photos[0];
  const holiday = event.holiday !== "none" ? HOLIDAY_CONFIG[event.holiday] : null;

  const addToCalendar = () => {
    const blob = new Blob([icsForEvent(event)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    event.address || `${event.latitude},${event.longitude}`,
  )}`;

  return (
    <div className="min-h-dvh bg-bg pb-28">
      <div className="relative h-[42vh] min-h-64 overflow-hidden bg-muted">
        {photo ? (
          <img src={photo} alt="" className="size-full object-cover" />
        ) : (
          <div className={cn("flex size-full items-center justify-center", cat.colorClass)}>
            <Icon className="size-16 text-primary-foreground/75" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-fg via-fg/20 to-transparent" />
        <Link
          to="/"
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-full bg-surface/95 shadow-[var(--shadow-border)]"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <button
          onClick={() => toggleSaved(event.id)}
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-full bg-surface/95 shadow-[var(--shadow-border)]"
          aria-label={saved ? "Unsave" : "Save"}
        >
          <Heart className={cn("size-5", saved && "fill-primary text-primary")} />
        </button>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-primary-foreground">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                cat.colorClass,
              )}
            >
              <Icon className="size-3" />
              {cat.label}
            </span>
            {event.is_free && <Badge variant="secondary">Free</Badge>}
            {holiday && <Badge variant="secondary">{holiday.label}</Badge>}
          </div>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 pt-5">
        <p className="flex items-center gap-2 text-sm">
          <Clock className="size-4 shrink-0 text-primary" />
          {formatEventWhen(event)}
        </p>
        {(event.location_name || event.address) && (
          <a
            href={maps}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-start gap-2 text-sm hover:text-primary"
          >
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="font-medium">{event.location_name}</span>
              {event.address && (
                <span className="mt-0.5 block text-xs text-muted-foreground">{event.address}</span>
              )}
            </span>
          </a>
        )}
        {!event.is_free && event.price_info && (
          <p className="mt-3 text-sm font-medium">{event.price_info}</p>
        )}
        {event.description && (
          <p className="mt-6 text-[15px] leading-relaxed text-fg/85">{event.description}</p>
        )}
        {event.website_url && (
          <a
            href={event.website_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            <ExternalLink className="size-4" />
            Official page
          </a>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <Button onClick={addToCalendar} className="rounded-full">
            <CalendarPlus className="size-4" />
            Calendar
          </Button>
          <Button variant="outline" className="rounded-full" onClick={share}>
            <Share2 className="size-4" />
            {copied ? "Copied" : "Share"}
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <a href={maps} target="_blank" rel="noreferrer">
              <MapPin className="size-4" />
              Go
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

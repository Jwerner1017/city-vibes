import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Heart, MapPin } from "lucide-react";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { dateStamp, formatEventWhen, formatTime } from "@/lib/event-utils";
import { getSavedIds, subscribeSaved, toggleSaved } from "@/lib/saved";
import type { EventItem } from "@/lib/types";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

export function EventCard({
  event,
  compact = false,
  hideWhen = false,
  featured = false,
}: {
  event: EventItem;
  compact?: boolean;
  hideWhen?: boolean;
  featured?: boolean;
}) {
  const cat = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.other;
  const Icon = cat.icon;
  const photo = event.photos[0];
  const when = hideWhen ? formatTime(event.date_start) : formatEventWhen(event);
  const stamp = dateStamp(event.date_start);

  if (compact) {
    return (
      <div className="flex items-stretch overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-[var(--motion-quick)] ease-[var(--ease-smooth-out)] hover:shadow-[var(--shadow-lift)]">
        <Link
          to="/event/$id"
          params={{ id: String(event.id) }}
          className="flex min-w-0 flex-1 items-center gap-3 p-2.5 pr-1"
        >
          {photo ? (
            <div
              className="size-14 shrink-0 rounded-lg bg-muted bg-cover bg-center"
              style={{ backgroundImage: `url(${photo})` }}
            />
          ) : event.is_permanent ? (
            <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-lg", cat.colorClass)}>
              <Icon className="size-5 text-primary-foreground" />
            </div>
          ) : (
            <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
              <span className="text-[9px] font-semibold tracking-wider text-muted-foreground">
                {stamp.month}
              </span>
              <span className="font-display text-lg font-semibold leading-none tracking-tight">
                {stamp.day}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] font-medium leading-snug tracking-tight">
              {event.title}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              <span className="truncate">{when}</span>
            </p>
            {event.location_name && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{event.location_name}</span>
              </p>
            )}
          </div>
        </Link>
        <div className="flex flex-col items-end justify-between p-2 pl-0">
          <SaveHeart id={event.id} />
          {event.is_free && (
            <Badge variant="secondary" className="mb-1">
              Free
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      to="/event/$id"
      params={{ id: String(event.id) }}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        featured && "w-64 shrink-0",
      )}
    >
      <div className={cn("relative overflow-hidden bg-muted", featured ? "h-44" : "h-40")}>
        {photo ? (
          <img src={photo} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className={cn("flex size-full items-center justify-center", cat.colorClass)}>
            <Icon className="size-12 text-primary-foreground/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-fg/55 via-fg/0 to-transparent" />
        <div className="absolute left-2.5 top-2.5 flex gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-primary-foreground",
              cat.colorClass,
            )}
          >
            <Icon className="size-3" />
            {cat.label}
          </span>
        </div>
        {event.is_free && (
          <Badge variant="secondary" className="absolute right-2.5 top-2.5">
            Free
          </Badge>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3 text-primary-foreground">
          <h3 className="font-display text-base font-medium leading-snug tracking-tight drop-shadow-sm">
            {event.title}
          </h3>
        </div>
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3 shrink-0" />
            {when}
          </p>
          {event.location_name && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{event.location_name}</span>
            </p>
          )}
        </div>
        <SaveHeart id={event.id} />
      </div>
    </Link>
  );
}

function SaveHeart({ id }: { id: number }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const sync = () => setSaved(getSavedIds().includes(id));
    sync();
    return subscribeSaved(sync);
  }, [id]);
  return (
    <button
      type="button"
      aria-label={saved ? "Unsave" : "Save"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(id);
      }}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-fg"
    >
      <Heart className={cn("size-4", saved && "fill-primary text-primary")} />
    </button>
  );
}

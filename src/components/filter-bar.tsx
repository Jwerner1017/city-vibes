import { useState } from "react";
import { Filter, Search, UtensilsCrossed, Trees, Music, Landmark, Ticket } from "lucide-react";
import { AGE_RANGES, CATEGORY_CONFIG, HOLIDAY_CONFIG } from "@/lib/constants";
import type { EventCategory, EventFilters, HolidayKey } from "@/lib/types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Drawer, DrawerContent, DrawerTitle } from "./ui/drawer";
import { cn } from "@/lib/utils";

const WINDOWS = [
  { id: "tonight" as const, label: "Tonight" },
  { id: "weekend" as const, label: "Weekend" },
  { id: "week" as const, label: "This week" },
];

const QUICK_CATS: Array<{ key: EventCategory; icon: typeof Trees }> = [
  { key: "outdoor", icon: Trees },
  { key: "food", icon: UtensilsCrossed },
  { key: "music", icon: Music },
  { key: "attraction", icon: Landmark },
];

export function FilterBar({
  filters,
  onChange,
  query,
  onQuery,
}: {
  filters: EventFilters;
  onChange: (next: EventFilters) => void;
  query?: string;
  onQuery?: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = [
    filters.category,
    filters.holiday,
    filters.is_free != null,
    filters.window && filters.window !== "all",
    filters.age_min != null,
  ].filter(Boolean).length;

  const toggle = <K extends keyof EventFilters>(key: K, value: EventFilters[K]) => {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  };

  return (
    <>
      {onQuery && (
        <div className="px-4 pb-1">
          <label className="flex h-9 items-center gap-2 rounded-full bg-muted/80 px-3 text-sm text-muted-foreground">
            <Search className="size-4 shrink-0" />
            <input
              value={query ?? ""}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search fish frys, parades, the zoo…"
              className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      )}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2">
        <Button
          variant={activeCount > 0 ? "default" : "outline"}
          size="sm"
          className="h-9 shrink-0 rounded-full"
          onClick={() => setOpen(true)}
        >
          <Filter className="size-3.5" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1">
              {activeCount}
            </Badge>
          )}
        </Button>
        {WINDOWS.map((w) => (
          <button
            key={w.id}
            onClick={() => toggle("window", w.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3.5 text-xs font-medium transition-colors",
              filters.window === w.id
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground shadow-[var(--shadow-border)]",
            )}
          >
            {w.label}
          </button>
        ))}
        <button
          onClick={() => toggle("is_free", true)}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors",
            filters.is_free === true
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-muted-foreground shadow-[var(--shadow-border)]",
          )}
        >
          <Ticket className="size-3.5" />
          Free
        </button>
        {QUICK_CATS.map(({ key, icon: Icon }) => {
          const cat = CATEGORY_CONFIG[key];
          return (
            <button
              key={key}
              onClick={() => toggle("category", key)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors",
                filters.category === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground shadow-[var(--shadow-border)]",
              )}
            >
              <Icon className="size-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <div className="overflow-y-auto px-5 pb-8 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <DrawerTitle>Filters</DrawerTitle>
              {activeCount > 0 && (
                <button
                  className="text-xs text-destructive"
                  onClick={() => {
                    onChange({});
                    setOpen(false);
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            <Section title="When">
              {WINDOWS.map((w) => (
                <Chip
                  key={w.id}
                  active={filters.window === w.id}
                  onClick={() => toggle("window", w.id)}
                >
                  {w.label}
                </Chip>
              ))}
            </Section>
            <Section title="Category">
              {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map((key) => (
                <Chip
                  key={key}
                  active={filters.category === key}
                  onClick={() => toggle("category", key)}
                >
                  {CATEGORY_CONFIG[key].label}
                </Chip>
              ))}
            </Section>
            <Section title="Season">
              {(Object.keys(HOLIDAY_CONFIG) as HolidayKey[])
                .filter((k) => k !== "none")
                .map((key) => (
                  <Chip
                    key={key}
                    active={filters.holiday === key}
                    onClick={() => toggle("holiday", key)}
                  >
                    {HOLIDAY_CONFIG[key].label}
                  </Chip>
                ))}
            </Section>
            <Section title="Price">
              {[
                { label: "All", value: null },
                { label: "Free only", value: true },
                { label: "Paid", value: false },
              ].map((opt) => (
                <Chip
                  key={String(opt.value)}
                  active={filters.is_free === opt.value}
                  onClick={() => onChange({ ...filters, is_free: opt.value })}
                >
                  {opt.label}
                </Chip>
              ))}
            </Section>
            <Section title="Ages">
              {AGE_RANGES.map((range) => (
                <Chip
                  key={range.label}
                  active={filters.age_min === range.min && filters.age_max === range.max}
                  onClick={() =>
                    onChange({
                      ...filters,
                      age_min:
                        filters.age_min === range.min && filters.age_max === range.max
                          ? null
                          : range.min,
                      age_max:
                        filters.age_min === range.min && filters.age_max === range.max
                          ? null
                          : range.max,
                    })
                  }
                >
                  {range.label}
                </Chip>
              ))}
            </Section>
            <Button className="mt-4 w-full rounded-full" onClick={() => setOpen(false)}>
              Show results
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="mb-2 font-display text-sm font-medium">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-xs font-medium",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

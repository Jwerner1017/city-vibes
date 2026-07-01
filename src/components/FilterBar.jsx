import React, { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CATEGORY_CONFIG, AGE_RANGES, HOLIDAY_CONFIG } from "@/lib/constants";

export default function FilterBar({ filters, onFiltersChange }) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(filters).filter(v => v !== null && v !== undefined && v !== "" && v !== "all").length;

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onFiltersChange({});
    setOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant={activeCount > 0 ? "default" : "outline"}
              size="sm"
              className="rounded-full flex-shrink-0 gap-1.5 h-8 select-none"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-white text-primary">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <SheetHeader className="pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-heading text-lg">Filters</SheetTitle>
                {activeCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive text-xs">
                    Clear All
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-5">
              <div>
                <h4 className="font-heading font-bold text-sm mb-2">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => updateFilter("category", filters.category === key ? null : key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium select-none transition-all ${
                        filters.category === key
                          ? "text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      style={filters.category === key ? { backgroundColor: cat.color } : {}}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-heading font-bold text-sm mb-2">Holiday</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(HOLIDAY_CONFIG).filter(([k]) => k !== "none").map(([key, h]) => (
                    <button
                      key={key}
                      onClick={() => updateFilter("holiday", filters.holiday === key ? null : key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium select-none transition-all ${
                        filters.holiday === key
                          ? "text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      style={filters.holiday === key ? { backgroundColor: h.color } : {}}
                    >
                      {h.emoji} {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-heading font-bold text-sm mb-2">Price</h4>
                <div className="flex gap-2">
                  {[
                    { label: "All", value: null },
                    { label: "Free Only", value: true },
                    { label: "Paid", value: false },
                  ].map(opt => (
                    <button
                      key={String(opt.value)}
                      onClick={() => updateFilter("is_free", opt.value)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium select-none transition-all ${
                        filters.is_free === opt.value
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-heading font-bold text-sm mb-2">Age Range</h4>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.map(range => (
                    <button
                      key={range.label}
                      onClick={() =>
                        updateFilter(
                          "age_range",
                          filters.age_range?.label === range.label ? null : range
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium select-none transition-all ${
                        filters.age_range?.label === range.label
                          ? "bg-accent text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setOpen(false)} className="w-full rounded-full h-12 font-heading font-bold text-base">
                Show Results
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick filter pills */}
        <button
          onClick={() => updateFilter("is_free", filters.is_free === true ? null : true)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium select-none flex-shrink-0 transition-all ${
            filters.is_free === true
              ? "bg-green-500 text-white"
              : "bg-white border border-border text-muted-foreground"
          }`}
        >
          Free
        </button>
        <button
          onClick={() => updateFilter("category", filters.category === "outdoor" ? null : "outdoor")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium select-none flex-shrink-0 transition-all ${
            filters.category === "outdoor"
              ? "bg-green-600 text-white"
              : "bg-white border border-border text-muted-foreground"
          }`}
        >
          🌳 Outdoor
        </button>
        <button
          onClick={() => updateFilter("category", filters.category === "food" ? null : "food")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium select-none flex-shrink-0 transition-all ${
            filters.category === "food"
              ? "bg-orange-500 text-white"
              : "bg-white border border-border text-muted-foreground"
          }`}
        >
          🍔 Food
        </button>
        <button
          onClick={() => updateFilter("category", filters.category === "music" ? null : "music")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium select-none flex-shrink-0 transition-all ${
            filters.category === "music"
              ? "bg-red-500 text-white"
              : "bg-white border border-border text-muted-foreground"
          }`}
        >
          🎵 Music
        </button>
        <button
          onClick={() => updateFilter("category", filters.category === "attraction" ? null : "attraction")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium select-none flex-shrink-0 transition-all ${
            filters.category === "attraction"
              ? "bg-orange-600 text-white"
              : "bg-white border border-border text-muted-foreground"
          }`}
        >
          🎢 Attractions
        </button>
      </div>
    </>
  );
}
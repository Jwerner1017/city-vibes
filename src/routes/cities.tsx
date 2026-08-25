import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, MapPin } from "lucide-react";
import { useCity } from "@/components/city-provider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cities")({
  component: CitiesPage,
});

function CitiesPage() {
  const { cities, selectedCity, setSelectedCity } = useCity();
  const navigate = useNavigate();
  const grouped = new Map<string, typeof cities>();
  for (const c of cities) {
    const list = grouped.get(c.state) ?? [];
    list.push(c);
    grouped.set(c.state, list);
  }

  return (
    <div className="min-h-dvh bg-bg pb-16">
      <header className="border-b border-border bg-surface px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Choose a city</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Louisville stays first. Other cities rotate through the overnight sync.
        </p>
      </header>
      <div className="px-4 pt-4">
        {[...grouped.entries()].map(([state, list]) => (
          <div key={state} className="mb-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {state}
            </h2>
            <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
              {list.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCity(c);
                    void navigate({ to: "/" });
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left",
                    i > 0 && "border-t border-border",
                  )}
                >
                  <MapPin className="size-4 text-primary" />
                  <span className="flex-1 font-medium">
                    {c.name}
                    <span className="ml-1 font-normal text-muted-foreground">{c.state_code}</span>
                  </span>
                  {selectedCity.id === c.id && <Check className="size-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

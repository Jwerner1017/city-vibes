import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { grokDiscover } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { useState } from "react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { selectedCity } = useCity();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const askGrok = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await grokDiscover({ data: { cityId: selectedCity.id } });
      if (res.ok) setStatus(`Added ${res.created} more listings from Grok.`);
      else setStatus(res.error);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not reach Grok.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg pb-16">
      <header className="px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/" className="inline-flex size-11 items-center" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
      </header>
      <article className="mx-auto max-w-lg px-5">
        <h1 className="font-display text-3xl font-semibold tracking-tight">One city. One feed.</h1>
        <p className="mt-4 text-sm leading-relaxed text-fg/85">
          Most people never go out because getting the picture means hopping the zoo site, the
          visitor bureau, a museum calendar, a neighborhood Facebook, and whatever the parks
          department posted last. City Vibes cancels that scavenger hunt.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-fg/85">
          We pull live listings from the places that already publish them — Louisville Zoo, Waterfront
          Park, the Speed, GoToLouisville — then keep the city's own landmarks on the map so there's
          always somewhere to point the car.
        </p>
        <h2 className="mt-8 font-display text-lg font-medium">The clock</h2>
        <ul className="mt-3 space-y-2 text-sm text-fg/85">
          <li>
            <span className="font-medium">Morning.</span> Louisville syncs first — zoo nights, park
            shows, visitor-bureau RSS.
          </li>
          <li>
            <span className="font-medium">Midday.</span> A rolling pair of other cities, so the rest
            of the map doesn't go stale.
          </li>
          <li>
            <span className="font-medium">Evening.</span> Louisville again, so tonight's lineup is
            actually tonight's.
          </li>
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Saved events live on this device. No account, no feed of people you don't know.
        </p>
        <Button
          className="mt-8 w-full rounded-full"
          onClick={askGrok}
          disabled={busy}
        >
          {busy ? "Asking Grok…" : `Find more in ${selectedCity.name}`}
        </Button>
        {status && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}
      </article>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createCommunityEvent } from "@/lib/queries";
import { rememberHosted } from "@/lib/hosted";
import { useCity } from "@/components/city-provider";
import { HostEventForm } from "@/components/host-event-form";
import { HostSuccess } from "@/components/host-success";

export const Route = createFileRoute("/holidays/halloween/host")({
  component: HostTrunkOrTreat,
});

function HostTrunkOrTreat() {
  const { selectedCity } = useCity();
  const [done, setDone] = useState<{ id: number; token: string; title: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="min-h-dvh bg-bg pb-16">
      <header className="bg-accent px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] text-accent-foreground">
        <Link
          to="/holidays/halloween"
          className="inline-flex size-11 items-center"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          Host a trunk-or-treat
        </h1>
        <p className="mt-1 max-w-md text-sm text-accent-foreground/80">
          Put it on the {selectedCity.name} map so families can find it without digging through
          Facebook groups. No account needed.
        </p>
      </header>
      <main className="mx-auto max-w-lg px-5 pt-5">
        {done ? (
          <HostSuccess
            {...done}
            onAnother={() => {
              setDone(null);
              setFormKey((k) => k + 1);
              window.scrollTo({ top: 0 });
            }}
          />
        ) : (
          <HostEventForm
            key={formKey}
            mode="trunk_or_treat"
            city={selectedCity}
            submitLabel="Put it on the map"
            busyLabel="Posting…"
            onSubmit={async (payload) => {
              const res = await createCommunityEvent({ data: payload });
              const title = payload.title.trim();
              rememberHosted({
                id: res.id,
                token: res.manageToken,
                title,
                date_start: payload.date_start,
              });
              setDone({ id: res.id, token: res.manageToken, title });
              window.scrollTo({ top: 0 });
            }}
          />
        )}
      </main>
    </div>
  );
}

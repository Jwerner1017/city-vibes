import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Ghost } from "lucide-react";
import { createCommunityEvent } from "@/lib/queries";
import { rememberHosted } from "@/lib/hosted";
import { useCity } from "@/components/city-provider";
import { HostEventForm } from "@/components/host-event-form";
import { HostSuccess } from "@/components/host-success";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

function CreatePage() {
  const { selectedCity } = useCity();
  const [done, setDone] = useState<{ id: number; token: string; title: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="min-h-dvh bg-bg pb-16">
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/" className="flex size-11 items-center" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl font-semibold">Add an event</h1>
      </header>
      <main className="mx-auto max-w-lg space-y-4 px-5 pt-4">
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
          <>
            <p className="text-sm text-muted-foreground">
              Public listings only — no personal names or emails. Pins to the address you enter in{" "}
              {selectedCity.name}.
            </p>
            <Link
              to="/holidays/halloween/host"
              className="flex min-h-11 items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm font-medium text-accent"
            >
              <Ghost className="size-4" /> Hosting a trunk-or-treat? Use the Halloween form →
            </Link>
            <HostEventForm
              key={formKey}
              mode="event"
              city={selectedCity}
              submitLabel="Publish"
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
          </>
        )}
      </main>
    </div>
  );
}

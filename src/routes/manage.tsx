import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarX, Loader2 } from "lucide-react";
import { cancelCommunityEvent, getManagedEvent, updateCommunityEvent } from "@/lib/queries";
import { forgetHosted, rememberHosted } from "@/lib/hosted";
import { isWellFormedToken } from "@/lib/hosting";
import { useCity } from "@/components/city-provider";
import { HostEventForm } from "@/components/host-event-form";
import { Button } from "@/components/ui/button";
import type { City, ManagedEvent } from "@/lib/types";

export const Route = createFileRoute("/manage")({
  component: ManagePage,
});

type State =
  { kind: "loading" } | { kind: "missing" } | { kind: "ready"; token: string; event: ManagedEvent };

function ManagePage() {
  const { cities, selectedCity } = useCity();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [saved, setSaved] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    // The token lives in the #fragment so it never appears in server or proxy logs.
    // Opening a second edit link in the same tab only changes the hash, so listen for it.
    let current = 0;
    const load = () => {
      const run = ++current;
      setSaved(null);
      setConfirmCancel(false);
      setCancelError(null);
      const token = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!isWellFormedToken(token)) {
        setState({ kind: "missing" });
        return;
      }
      setState({ kind: "loading" });
      getManagedEvent({ data: { token } })
        .then((event) => {
          if (run === current)
            setState(event ? { kind: "ready", token, event } : { kind: "missing" });
        })
        .catch(() => {
          if (run === current) setState({ kind: "missing" });
        });
    };
    load();
    window.addEventListener("hashchange", load);
    return () => {
      current = -1;
      window.removeEventListener("hashchange", load);
    };
  }, []);

  const city: City | undefined =
    state.kind === "ready"
      ? (cities.find((c) => c.id === state.event.city_id) ?? selectedCity)
      : undefined;

  return (
    <div className="min-h-dvh bg-bg pb-16">
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/profile" className="flex size-11 items-center" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl font-semibold">Manage your listing</h1>
      </header>
      <main className="mx-auto max-w-lg space-y-4 px-5 pt-4">
        {state.kind === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Opening your listing…
          </p>
        )}
        {state.kind === "missing" && (
          <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="font-display text-lg">That edit link doesn't open anything.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check that the whole link was copied. Listings posted from this device are under
              Profile → Your listings.
            </p>
            <Button asChild variant="outline" className="mt-4 rounded-full">
              <Link to="/profile">Go to Profile</Link>
            </Button>
          </div>
        )}
        {state.kind === "ready" && city && (
          <>
            <StatusNote event={state.event} />
            {saved && (
              <p role="status" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
                {saved}
              </p>
            )}
            {state.event.status !== "cancelled" && (
              <>
                <HostEventForm
                  key={state.event.id}
                  mode={state.event.category === "trick_or_treat" ? "trunk_or_treat" : "event"}
                  city={city}
                  initial={state.event}
                  submitLabel="Save changes"
                  busyLabel="Saving…"
                  onSubmit={async (payload) => {
                    const res = await updateCommunityEvent({
                      data: { ...payload, token: state.token },
                    });
                    const fresh = await getManagedEvent({ data: { token: state.token } });
                    if (fresh) {
                      setState({ kind: "ready", token: state.token, event: fresh });
                      rememberHosted({
                        id: fresh.id,
                        token: state.token,
                        title: fresh.title,
                        date_start: fresh.date_start,
                      });
                    }
                    // Only promise "families see it" when the listing is actually on the map.
                    setSaved(
                      res.restored
                        ? "Saved — it's back on the map."
                        : fresh?.status === "approved"
                          ? "Saved. Families see the update now."
                          : "Saved. It stays hidden because neighbors reported it again.",
                    );
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
                <section className="rounded-2xl border border-destructive/30 p-4">
                  <p className="text-sm font-medium">Not happening anymore?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cancelling takes it off the map right away. It can't be undone.
                  </p>
                  {cancelError && <p className="mt-2 text-sm text-destructive">{cancelError}</p>}
                  {confirmCancel ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setConfirmCancel(false)}
                        disabled={cancelling}
                      >
                        Keep it
                      </Button>
                      <Button
                        variant="destructive"
                        className="rounded-full"
                        disabled={cancelling}
                        onClick={async () => {
                          setCancelling(true);
                          setCancelError(null);
                          try {
                            await cancelCommunityEvent({ data: { token: state.token } });
                            forgetHosted(state.event.id);
                            setState({
                              kind: "ready",
                              token: state.token,
                              event: { ...state.event, status: "cancelled" },
                            });
                          } catch (err) {
                            setCancelError(err instanceof Error ? err.message : "Couldn't cancel.");
                          } finally {
                            setCancelling(false);
                            setConfirmCancel(false);
                          }
                        }}
                      >
                        {cancelling ? <Loader2 className="animate-spin" /> : <CalendarX />}
                        Cancel it
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="mt-3 w-full rounded-full text-destructive"
                      onClick={() => setConfirmCancel(true)}
                    >
                      <CalendarX /> Cancel this listing
                    </Button>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatusNote({ event }: { event: ManagedEvent }) {
  if (event.status === "cancelled") {
    return (
      <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-display text-lg">{event.title} is cancelled.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It's off the map. Thanks for letting families know.
        </p>
      </div>
    );
  }
  if (event.status === "hidden") {
    return (
      <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {event.restores_left > 0
          ? "Several neighbors reported this listing, so it's hidden from the map. Check the time, place, and details, then save — that puts it back on the map (this works once)."
          : "Neighbors reported this listing again after it was restored, so it stays off the map."}
      </p>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      Live on the map.{" "}
      <Link to="/event/$id" params={{ id: String(event.id) }} className="font-medium text-primary">
        See it as families do →
      </Link>
    </p>
  );
}

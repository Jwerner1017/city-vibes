import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { reportEvent } from "@/lib/queries";
import { REPORT_REASONS, type ReportReason } from "@/lib/hosting";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Lets neighbors flag a bad listing; enough distinct reports hide community posts. */
export function ReportListing({ eventId }: { eventId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p role="status" className="mt-8 text-xs text-muted-foreground">
        Thanks — we'll take a look. Listings with several reports come off the map.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-fg"
      >
        <Flag className="size-3.5" /> Report a problem with this listing
      </button>
    );
  }

  return (
    <fieldset className="mt-8 space-y-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <legend className="sr-only">What's wrong?</legend>
      <p className="text-sm font-medium">What's wrong?</p>
      {REPORT_REASONS.map((r) => (
        <label
          key={r.key}
          className={cn(
            "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm",
            reason === r.key ? "border-primary bg-primary/10" : "border-border",
          )}
        >
          <input
            type="radio"
            name="report_reason"
            className="size-4 accent-primary"
            checked={reason === r.key}
            onChange={() => setReason(r.key)}
          />
          {r.label}
        </label>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => setOpen(false)}
        >
          Never mind
        </Button>
        <Button
          type="button"
          className="rounded-full"
          disabled={!reason || busy}
          onClick={async () => {
            if (!reason) return;
            setBusy(true);
            setError(null);
            try {
              await reportEvent({ data: { id: eventId, reason } });
              setDone(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Couldn't send that. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy && <Loader2 className="animate-spin" />} Send report
        </Button>
      </div>
    </fieldset>
  );
}

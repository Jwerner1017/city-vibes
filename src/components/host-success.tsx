import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { manageUrl } from "@/lib/hosted";

/** Shown once after posting: the manage link is the host's only key to edit. */
export function HostSuccess({
  id,
  token,
  title,
  onAnother,
}: {
  id: number;
  token: string;
  title: string;
  onAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const link = manageUrl(token);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the link stays selectable on screen.
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-surface p-5 text-center shadow-[var(--shadow-border)]">
        <PartyPopper className="mx-auto size-8 text-primary" />
        <h2 className="mt-3 font-display text-xl font-semibold">You're on the map</h2>
        <p className="mt-1 text-sm text-muted-foreground">{title} is live for families now.</p>
      </div>

      <div className="space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-medium">Save your private edit link</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          It's the only way to change the time, fix the address, or cancel. We don't collect emails,
          so we can't resend it. This device remembers it under Profile → Your listings.
        </p>
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 w-full rounded-md border border-input bg-surface px-3 text-xs"
          aria-label="Private edit link"
        />
        <Button type="button" variant="outline" className="w-full rounded-full" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy edit link"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild className="rounded-full">
          <Link to="/event/$id" params={{ id: String(id) }}>
            See listing
          </Link>
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onAnother}>
          Post another
        </Button>
      </div>
    </div>
  );
}

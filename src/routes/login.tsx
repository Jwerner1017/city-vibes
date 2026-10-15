import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import XIcon from "@/components/XIcon";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { safeReturnTo } from "@/lib/authReturnTo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function ProviderIcon({ providerId, className }: { providerId: string; className?: string }) {
  if (providerId === "grok-x") return <XIcon className={className} />;
  return <GoogleIcon className={className} />;
}

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  // Already signed in (e.g. a consent link opened in a new tab): resume the
  // flow that sent us here instead of asking again.
  useEffect(() => {
    if (!isPending && user) window.location.replace(safeReturnTo());
  }, [isPending, user]);

  const handleSignIn = async (providerId: string) => {
    setError("");
    setBusy(providerId);
    try {
      await signIn(providerId, { callbackURL: safeReturnTo(), errorCallbackURL: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setBusy("");
    }
  };

  return (
    <div className="min-h-dvh bg-bg pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="px-4">
        <Link to="/" className="inline-flex size-11 items-center" aria-label="Back to events">
          <ArrowLeft className="size-5" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-sm px-5 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          City Vibes
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Use the account you already have. Approving an app asks you to sign in here first, then
          returns you to the approval screen.
        </p>

        <div className="mt-8 space-y-3 rounded-lg bg-surface p-5 shadow-[var(--shadow-border)]">
          {!authEnabled ? (
            <p className="text-sm text-muted-foreground">
              Sign-in is turned off for this app right now.
            </p>
          ) : (
            GROK_PROVIDERS.map((provider) => (
              <Button
                key={provider.providerId}
                variant="outline"
                size="lg"
                className="w-full rounded-full"
                disabled={Boolean(busy)}
                onClick={() => handleSignIn(provider.providerId)}
              >
                {busy === provider.providerId ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ProviderIcon providerId={provider.providerId} className="size-5" />
                )}
                Continue with {provider.label}
              </Button>
            ))
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Your name and email are shared only with apps you approve, and only for the access you
          grant.
        </p>
      </main>
    </div>
  );
}
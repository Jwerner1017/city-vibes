import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import OAuthConsent from "@/pages/OAuthConsent";

export const Route = createFileRoute("/oauth/consent")({
  component: ConsentRoute,
});

// The consent screen reads the `ctx` handle from the URL and talks to the MCP
// consent backend, so it is rendered client-side only (no auth guard in front of
// it — the page itself handles the signed-out case and preserves `ctx`).
function ConsentRoute() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <OAuthConsent />;
}
/**
 * Listings this device posted, with their private manage tokens, so a host can
 * get back to "edit" without an account. Lives only in this browser.
 */
export type HostedListing = { id: number; token: string; title: string; date_start: string };

const KEY = "cityvibes_hosted";
const EVENT = "cityvibes-hosted";

function read(): HostedListing[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(
          (x): x is HostedListing =>
            !!x &&
            typeof x === "object" &&
            typeof (x as HostedListing).token === "string" &&
            Number.isFinite(Number((x as HostedListing).id)),
        )
      : [];
  } catch {
    return [];
  }
}

function write(list: HostedListing[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private mode or full storage: the host still has the link on screen.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function getHosted(): HostedListing[] {
  return read();
}

export function hostedTokenFor(id: number): string | null {
  return read().find((l) => Number(l.id) === id)?.token ?? null;
}

export function rememberHosted(listing: HostedListing) {
  write([listing, ...read().filter((l) => Number(l.id) !== listing.id)].slice(0, 50));
}

export function forgetHosted(id: number) {
  write(read().filter((l) => Number(l.id) !== id));
}

export function subscribeHosted(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** The manage link keeps the token in the #fragment so it never reaches server logs. */
export function manageUrl(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/manage#${token}`;
}

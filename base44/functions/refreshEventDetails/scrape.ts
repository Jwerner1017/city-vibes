// Reads an event's own web page and pulls out the details the page publishes about that event.

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; CityVibesBot/1.0; +https://city-vibes.app)",
  Accept: "text/html,application/xhtml+xml",
};
const MAX_BYTES = 1_000_000;
const NAMED = { amp: "&", quot: '"', lt: "<", gt: ">", nbsp: " ", apos: "'" };

// Public web hosts only: no IP literals, ports, credentials or internal names,
// so a submitted link can never point this crawler at a private service.
function publicHttpUrl(value) {
  let u;
  try {
    u = new URL(String(value || "").trim());
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.port || u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  if (!host.includes(".") || host.includes(":") || /^[\d.]+$/.test(host)) return null;
  if (/(^|\.)(localhost|local|internal|lan|home|corp)$/.test(host)) return null;
  return u;
}

function decode(s) {
  return String(s ?? "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, ent) => {
    if (ent[0] !== "#") return NAMED[ent.toLowerCase()] ?? m;
    const n = /^#x/i.test(ent) ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
    return Number.isFinite(n) && n <= 0x10ffff ? String.fromCodePoint(n) : m;
  });
}

function clean(s) {
  if (typeof s !== "string" && typeof s !== "number") return "";
  return decode(String(s).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function norm(s) {
  return clean(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sameTitle(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length < y.length ? [x, y] : [y, x];
  return short.length >= 8 && long.includes(short);
}

async function readCapped(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  let bytes = 0;
  while (bytes < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    html += decoder.decode(value, { stream: true });
  }
  await reader.cancel().catch(() => {});
  return html;
}

// Follows redirects by hand so every hop is re-checked against publicHttpUrl.
async function fetchHtml(startUrl) {
  let url = publicHttpUrl(startUrl);
  for (let hop = 0; url && hop < 4; hop++) {
    const res = await fetch(url, { headers: HEADERS, redirect: "manual", signal: AbortSignal.timeout(10_000) });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      await res.body?.cancel();
      url = next ? publicHttpUrl(new URL(next, url)) : null;
      continue;
    }
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !/html/i.test(type)) {
      await res.body?.cancel();
      throw new Error(res.ok ? `not a web page (${type})` : `HTTP ${res.status}`);
    }
    return { html: await readCapped(res), url };
  }
  throw new Error(url ? "too many redirects" : "link is not a public web address");
}

// schema.org Event entries the page publishes as JSON-LD.
function eventNodes(html) {
  const out = [];
  const walk = (n, depth) => {
    if (!n || depth > 6) return;
    if (Array.isArray(n)) {
      n.forEach((x) => walk(x, depth + 1));
      return;
    }
    if (typeof n !== "object") return;
    const types = [].concat(n["@type"] || []);
    if (types.some((t) => /Event$|^Festival$/.test(String(t)))) out.push(n);
    walk(n["@graph"], depth + 1);
    walk(n.itemListElement, depth + 1);
    walk(n.item, depth + 1);
  };
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1].trim()), 0);
    } catch {
      // malformed block: skip it
    }
  }
  return out;
}

function meta(html, key) {
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i"))?.[0] || "";
  const m = tag.match(/content=(?:"([^"]*)"|'([^']*)')/i);
  return m ? decode(m[1] ?? m[2]) : "";
}

// Keeps the page's own time: UTC when it states an offset, otherwise the local time as written.
function pageDate(v) {
  const s = String(v || "").trim();
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(s)) return null;
  if (/(z|[+-]\d\d:?\d\d)$/i.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return `${s.slice(0, 16)}:00`;
}

function placeOf(node) {
  const loc = [].concat(node.location || []).find((l) => l && typeof l === "object" && l["@type"] !== "VirtualLocation");
  if (!loc) return {};
  const a = loc.address;
  let address = "";
  if (typeof a === "string") address = clean(a);
  else if (a?.streetAddress) {
    address = [a.streetAddress, a.addressLocality, [a.addressRegion, a.postalCode].map(clean).filter(Boolean).join(" ")]
      .map(clean)
      .filter(Boolean)
      .join(", ");
  }
  return { location_name: clean(loc.name), address, lat: Number(loc.geo?.latitude), lng: Number(loc.geo?.longitude) };
}

function priceOf(node) {
  const nums = [].concat(node.offers || [])
    .filter((o) => o && typeof o === "object" && (!o.priceCurrency || o.priceCurrency === "USD"))
    .flatMap((o) => [o.price, o.lowPrice, o.highPrice])
    .filter((v) => v !== undefined && v !== null && v !== "")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0);
  if (!nums.length) return {};
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const fmt = (n) => (n === 0 ? "Free" : `$${Number.isInteger(n) ? n : n.toFixed(2)}`);
  return { is_free: hi === 0, price_info: lo === hi ? fmt(hi) : `${fmt(lo)} to ${fmt(hi)}` };
}

function imageOf(v) {
  const first = [].concat(v || [])[0];
  const u = publicHttpUrl(typeof first === "string" ? first : first?.url);
  return u?.protocol === "https:" ? u.toString() : "";
}

/** Fetches a page once and keeps only what is needed to match events against it. Throws when unreachable. */
export async function fetchPage(startUrl) {
  const { html, url } = await fetchHtml(startUrl);
  return {
    events: eventNodes(html),
    ogTitle: meta(html, "og:title"),
    ogImage: meta(html, "og:image"),
    links: linksOf(html, url),
  };
}

// Links on the page that stay on the same site, with their visible text.
function linksOf(html, base) {
  const out = [];
  const host = base.hostname.replace(/^www\./, "");
  for (const m of html.matchAll(/<a\b[^>]*?href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    if (out.length >= 1500) break;
    const text = clean(m[2]);
    if (text.length < 4 || text.length > 200) continue;
    let u = null;
    try {
      u = publicHttpUrl(new URL(decode(m[1]), base));
    } catch {
      continue;
    }
    if (u && u.hostname.replace(/^www\./, "") === host) out.push({ text, url: u.toString() });
  }
  return out;
}

/** On a homepage or calendar, the link whose text names this event. Null when there is none. */
export function findEventLink(page, title, currentUrl) {
  return page.links.find((l) => l.url !== currentUrl && sameTitle(l.text, title))?.url || null;
}

/**
 * Details the page publishes for this exact event, or null when the page is not about it.
 * Dates are only returned when the page's occurrence is on the event's own day, so a
 * page showing the next date of a long-running event never moves other days.
 */
export function matchEvent(page, title, dateStart) {
  const day = String(dateStart || "").slice(0, 10);
  const named = page.events.filter((n) => sameTitle(n.name, title));
  const node = named.find((n) => String(n.startDate || "").slice(0, 10) === day) || named[0];
  if (node) {
    const start = pageDate(node.startDate);
    const end = pageDate(node.endDate);
    const sameDay = Boolean(start) && start.slice(0, 10) === day;
    return {
      structured: true,
      ...placeOf(node),
      ...priceOf(node),
      description: clean(node.description),
      photo: imageOf(node.image),
      date_start: sameDay ? start : null,
      date_end: sameDay && end && new Date(end) > new Date(start) ? end : null,
    };
  }
  if (sameTitle(page.ogTitle, title)) return { structured: false, photo: imageOf(page.ogImage) };
  return null;
}
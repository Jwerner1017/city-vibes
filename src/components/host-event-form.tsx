import { useMemo, useRef, useState, type FormEvent } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { geocodeAddress } from "@/lib/queries";
import { AMENITIES, areasForCity } from "@/lib/areas";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { HostInput, HostKind } from "@/lib/hosting";
import type { City, EventCategory, EventItem } from "@/lib/types";
import { PinPicker } from "@/components/pin-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const OTHER = "__other";

/** "pending": the address couldn't be found and the host hasn't placed the pin yet. */
type Located = "none" | "found" | "pending" | "manual";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localParts(iso: string | null | undefined) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Joins the form's local date + times into ISO instants in the viewer's own time zone. */
function toInstants(date: string, start: string, end: string) {
  if (!date || !start) return null;
  const s = new Date(`${date}T${start}`);
  if (Number.isNaN(s.getTime())) return null;
  let e: Date | null = null;
  if (end) {
    e = new Date(`${date}T${end}`);
    if (Number.isNaN(e.getTime())) return null;
    // "6pm–12:30am" runs past midnight.
    if (e.getTime() <= s.getTime()) e = new Date(e.getTime() + 86_400_000);
  }
  return { date_start: s.toISOString(), date_end: e ? e.toISOString() : null };
}

export type HostEventPayload = HostInput;

export function HostEventForm({
  mode,
  city,
  initial,
  submitLabel,
  busyLabel,
  onSubmit,
}: {
  mode: HostKind;
  city: City;
  initial?: EventItem | null;
  submitLabel: string;
  busyLabel: string;
  onSubmit: (payload: HostEventPayload) => Promise<void>;
}) {
  const trunk = mode === "trunk_or_treat";
  const areas = useMemo(
    () => areasForCity(city.name, city.state_code),
    [city.name, city.state_code],
  );
  const areaNames = useMemo(() => areas.map((a) => a.name), [areas]);

  const startParts = localParts(initial?.date_start);
  const endParts =
    initial?.date_end && initial.date_end !== initial.date_start
      ? localParts(initial.date_end)
      : null;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [hostName, setHostName] = useState(initial?.host_name ?? "");
  const [date, setDate] = useState(startParts.date);
  const [startTime, setStartTime] = useState(startParts.time);
  const [endTime, setEndTime] = useState(endParts?.time ?? "");
  // The server fills location_name with the host or address when it's left blank;
  // don't echo those back as "spot details", or an edited address would keep the old one.
  const [placeName, setPlaceName] = useState(
    initial &&
      initial.location_name !== initial.host_name &&
      initial.location_name !== initial.address
      ? (initial.location_name ?? "")
      : "",
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood ?? "");
  /** The area was filled in from the address, so a corrected address may replace it. */
  const autoArea = useRef(false);
  const [otherArea, setOtherArea] = useState(
    Boolean(initial?.neighborhood && !areaNames.includes(initial.neighborhood)),
  );
  const [category, setCategory] = useState<string>(initial?.category ?? "community");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [website, setWebsite] = useState(initial?.website_url ?? "");
  const [isFree, setIsFree] = useState(initial ? initial.is_free : true);
  const [amenities, setAmenities] = useState<string[]>(initial?.amenities ?? []);

  const [lat, setLat] = useState<number | null>(initial?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(initial?.longitude ?? null);
  const [located, setLocated] = useState<Located>(initial ? "found" : "none");
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoNote, setGeoNote] = useState<string | null>(null);
  const lookedUp = useRef<string>(initial?.address ?? "");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const inflight = useRef<{ q: string; p: Promise<{ lat: number; lng: number } | null> } | null>(
    null,
  );

  /** Looks the address up once per distinct query; a blur and a submit share one request. */
  const lookup = (force = false): Promise<{ lat: number; lng: number } | null> => {
    const q = address.trim();
    if (q.length < 4) {
      setGeoNote("Type a street address or place name first.");
      return Promise.resolve(null);
    }
    if (!force && q === lookedUp.current && lat != null && located !== "pending") {
      return Promise.resolve({ lat, lng: lng! });
    }
    if (inflight.current?.q === q) return inflight.current.p;
    const p = runLookup(q).finally(() => {
      if (inflight.current?.p === p) inflight.current = null;
    });
    inflight.current = { q, p };
    return p;
  };

  const runLookup = async (q: string): Promise<{ lat: number; lng: number } | null> => {
    setGeoBusy(true);
    setGeoNote(null);
    try {
      const res = await geocodeAddress({ data: { cityId: city.id, address: q } });
      lookedUp.current = q;
      if (res.ok) {
        setLat(res.latitude);
        setLng(res.longitude);
        setLocated("found");
        setGeoNote(`Found: ${res.matched}. Drag the pin if it's a little off.`);
        if (res.area && (!neighborhood || autoArea.current)) {
          autoArea.current = true;
          setNeighborhood(res.area);
          setOtherArea(!areaNames.includes(res.area));
        }
        return { lat: res.latitude, lng: res.longitude };
      }
      if (lat == null) {
        setLat(city.latitude);
        setLng(city.longitude);
      }
      setLocated("pending");
      setGeoNote(res.error);
      return null;
    } catch {
      setGeoNote("Couldn't look that up right now. Drag the pin to the spot.");
      if (lat == null) {
        setLat(city.latitude);
        setLng(city.longitude);
      }
      setLocated("pending");
      return null;
    } finally {
      setGeoBusy(false);
    }
  };

  const fail = (message: string) => {
    setError(message);
    requestAnimationFrame(() =>
      errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
    );
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (busy) return;
    const times = toInstants(date, startTime, endTime);
    if (!times) return fail("Pick a date and start time.");
    if (trunk && !times.date_end) return fail("Add an end time so families know when to come.");
    setBusy(true);
    try {
      await save(times);
    } finally {
      setBusy(false);
    }
  };

  const save = async (times: { date_start: string; date_end: string | null }) => {
    // A new or never-checked address is looked up now; otherwise the pin on the
    // map counts only once it was found or placed by hand.
    const needsLookup = address.trim() !== lookedUp.current || located === "none";
    const point = needsLookup
      ? await lookup(true)
      : (located === "found" || located === "manual") && lat != null && lng != null
        ? { lat, lng }
        : null;
    if (!point) {
      return fail("We couldn't find that address. Drag the pin on the map to the exact spot.");
    }

    try {
      await onSubmit({
        cityId: city.id,
        kind: mode,
        title,
        host_name: hostName,
        description,
        date_start: times.date_start,
        date_end: times.date_end,
        location_name: placeName,
        address,
        latitude: point.lat,
        longitude: point.lng,
        neighborhood,
        category: trunk ? "trick_or_treat" : category,
        is_free: isFree,
        website_url: website,
        amenities,
      });
    } catch (err) {
      fail(err instanceof Error ? err.message : "Couldn't save that. Try again.");
    }
  };

  const areaChoice = otherArea ? OTHER : areaNames.includes(neighborhood) ? neighborhood : "";

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label="Name" htmlFor="title">
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder={trunk ? "St. Agnes Trunk-or-Treat" : "Waterfront concert"}
        />
      </Field>

      <Field
        label={trunk ? "Who's hosting" : "Who's putting it on (optional)"}
        htmlFor="host_name"
        hint="A church, school, business, club, or street — not a person's name."
      >
        <Input
          id="host_name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          required={trunk}
          maxLength={120}
          placeholder={trunk ? "St. Agnes Church" : "Friends of Cherokee Park"}
        />
      </Field>

      {/* Native date/time inputs have a wide intrinsic size on mobile, so the
          date gets its own row and each input may shrink (min-w-0). */}
      <div className="grid grid-cols-2 gap-2 [&_input]:min-w-0">
        <div className="col-span-2">
          <Field label="Date" htmlFor="date">
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Starts" htmlFor="start_time">
          <Input
            id="start_time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </Field>
        <Field label={trunk ? "Ends" : "Ends (opt.)"} htmlFor="end_time">
          <Input
            id="end_time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required={trunk}
          />
        </Field>
      </div>

      <section className="space-y-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-display text-sm font-medium">Where</p>
        <Field label="Address or place" htmlFor="address">
          <div className="flex gap-2">
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => {
                if (address.trim().length >= 6 && address.trim() !== lookedUp.current)
                  void lookup();
              }}
              autoComplete="street-address"
              maxLength={300}
              placeholder="1920 Newburg Rd"
              required
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => void lookup(true)}
              disabled={geoBusy}
              aria-label="Find on map"
            >
              {geoBusy ? <Loader2 className="animate-spin" /> : <LocateFixed />}
              <span className="hidden sm:inline">Find</span>
            </Button>
          </div>
        </Field>
        {geoNote && (
          <p
            className={cn(
              "text-xs",
              located === "pending" ? "text-destructive" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {geoNote}
          </p>
        )}
        {lat != null && lng != null && (
          <PinPicker
            latitude={lat}
            longitude={lng}
            onMove={(a, b) => {
              // A hand-placed pin counts for the address as typed now.
              lookedUp.current = address.trim();
              setLat(a);
              setLng(b);
              setLocated("manual");
              setGeoNote("Pin placed. That's where families will be sent.");
            }}
          />
        )}
        <Field label="Spot details (optional)" htmlFor="location_name">
          <Input
            id="location_name"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            maxLength={200}
            placeholder={trunk ? "Back parking lot off Newburg" : "Great Lawn"}
          />
        </Field>
        <Field label="Area" htmlFor="neighborhood">
          {areaNames.length > 0 && (
            <Select
              value={areaChoice}
              onValueChange={(v) => {
                if (v === OTHER) {
                  autoArea.current = false;
                  setOtherArea(true);
                  if (areaNames.includes(neighborhood)) setNeighborhood("");
                } else {
                  autoArea.current = false;
                  setOtherArea(false);
                  setNeighborhood(v);
                }
              }}
            >
              <SelectTrigger id="neighborhood" className="h-11 w-full bg-surface">
                <SelectValue placeholder="Pick the area" />
              </SelectTrigger>
              <SelectContent className="max-h-72 bg-surface">
                {areaNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>Somewhere else…</SelectItem>
              </SelectContent>
            </Select>
          )}
          {(otherArea || areaNames.length === 0) && (
            <Input
              id={areaNames.length ? "neighborhood_other" : "neighborhood"}
              className={areaNames.length ? "mt-2" : undefined}
              value={neighborhood}
              onChange={(e) => {
                autoArea.current = false;
                setNeighborhood(e.target.value);
              }}
              maxLength={80}
              placeholder="Neighborhood or subdivision"
              aria-label="Neighborhood"
            />
          )}
        </Field>
      </section>

      {!trunk && (
        <Field label="Category" htmlFor="category">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="h-11 w-full bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface">
              {(Object.keys(CATEGORY_CONFIG) as EventCategory[])
                // Trunk-or-treats have their own form (host + end time required).
                .filter((k) => k !== "trick_or_treat")
                .map((k) => (
                  <SelectItem key={k} value={k}>
                    {CATEGORY_CONFIG[k].label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {trunk && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Good to know (optional)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {AMENITIES.map((a) => {
              const on = amenities.includes(a.key);
              return (
                <label
                  key={a.key}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm transition-colors",
                    on ? "border-primary bg-primary/10" : "border-border bg-surface",
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={on}
                    onChange={() =>
                      setAmenities((cur) => (on ? cur.filter((k) => k !== a.key) : [...cur, a.key]))
                    }
                  />
                  {a.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <Field
        label={trunk ? "Anything else families should know" : "What is it"}
        htmlFor="description"
      >
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          placeholder={
            trunk ? "Costumes welcome, bring a bag. Rain date Nov 1." : "Short and useful."
          }
        />
      </Field>

      <Field label="Link (optional)" htmlFor="website_url" hint="Your Facebook event or website.">
        <Input
          id="website_url"
          type="url"
          inputMode="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
        />
      </Field>

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isFree}
          onChange={(e) => setIsFree(e.target.checked)}
          className="size-4 accent-primary"
        />
        Free to attend
      </label>

      {error && (
        <p
          ref={errorRef}
          role="alert"
          className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="animate-spin" /> {busyLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

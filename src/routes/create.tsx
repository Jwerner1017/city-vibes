import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { createCommunityEvent } from "@/lib/queries";
import { useCity } from "@/components/city-provider";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { EventCategory } from "@/lib/types";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

function CreatePage() {
  const { selectedCity } = useCity();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const result = await createCommunityEvent({
        data: {
          cityId: selectedCity.id,
          title: String(form.get("title") || ""),
          description: String(form.get("description") || ""),
          date_start: String(form.get("date_start") || ""),
          location_name: String(form.get("location_name") || selectedCity.name),
          address: String(form.get("address") || `${selectedCity.name}, ${selectedCity.state_code}`),
          latitude: selectedCity.latitude,
          longitude: selectedCity.longitude,
          category: String(form.get("category") || "community"),
          is_free: form.get("is_free") === "on",
          website_url: String(form.get("website_url") || "") || undefined,
        },
      });
      await navigate({ to: "/event/$id", params: { id: String(result.id) } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post that.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg pb-16">
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/" className="flex size-11 items-center" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl font-semibold">Add an event</h1>
      </header>
      <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 px-5 pt-4">
        <p className="text-sm text-muted-foreground">
          Public listings only — no names, no emails. Pins to {selectedCity.name}.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="title">Name</Label>
          <Input id="title" name="title" required placeholder="Waterfront concert" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date_start">Starts</Label>
          <Input id="date_start" name="date_start" type="datetime-local" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location_name">Place</Label>
          <Input id="location_name" name="location_name" placeholder="Waterfront Park" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" placeholder="129 E River Rd" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue="community"
            className="flex h-11 w-full rounded-md border border-input bg-surface px-3 text-sm"
          >
            {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map((k) => (
              <option key={k} value={k}>
                {CATEGORY_CONFIG[k].label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">What is it</Label>
          <Textarea id="description" name="description" placeholder="Short and useful." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website_url">Link (optional)</Label>
          <Input id="website_url" name="website_url" type="url" placeholder="https://" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_free" defaultChecked className="size-4 accent-primary" />
          Free to attend
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full rounded-full" disabled={busy}>
          {busy ? "Posting…" : "Publish"}
        </Button>
      </form>
    </div>
  );
}

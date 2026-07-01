import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Camera, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { CATEGORY_CONFIG, HOLIDAY_CONFIG, LOUISVILLE_CENTER } from "@/lib/constants";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date_start: "",
    date_end: "",
    location_name: "",
    address: "",
    latitude: LOUISVILLE_CENTER[0],
    longitude: LOUISVILLE_CENTER[1],
    category: "community",
    holiday: "none",
    is_free: true,
    price_info: "",
    age_min: 0,
    age_max: 18,
    website_url: "",
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: LOUISVILLE_CENTER,
      zoom: 13,
      zoomControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(LOUISVILLE_CENTER, { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setForm(f => ({ ...f, latitude: pos.lat, longitude: pos.lng }));
    });
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setForm(f => ({ ...f, latitude: e.latlng.lat, longitude: e.latlng.lng }));
    });

    mapInstance.current = map;
    markerRef.current = marker;

    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotos(prev => [...prev, file_url]);
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.date_start) {
      toast({ title: "Please add a title and date", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await base44.entities.Event.create({
      ...form,
      photos,
      status: "pending",
      going_count: 0,
      save_count: 0,
    });
    toast({ title: "Event submitted! 🎉", description: "It'll appear after approval." });
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-border z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-heading font-bold text-base">Post an Event</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5 max-w-lg mx-auto">
        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Event Name *
          </label>
          <Input
            value={form.title}
            onChange={e => update("title", e.target.value)}
            placeholder="What's happening?"
            className="mt-1.5 h-12 rounded-xl text-base font-medium"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Category
          </label>
          <Select value={form.category} onValueChange={v => update("category", v)}>
            <SelectTrigger className="mt-1.5 h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Start *
            </label>
            <Input
              type="datetime-local"
              value={form.date_start}
              onChange={e => update("date_start", e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              End
            </label>
            <Input
              type="datetime-local"
              value={form.date_end}
              onChange={e => update("date_end", e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Location Name
          </label>
          <Input
            value={form.location_name}
            onChange={e => update("location_name", e.target.value)}
            placeholder="e.g. Waterfront Park"
            className="mt-1.5 h-12 rounded-xl"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Address
          </label>
          <Input
            value={form.address}
            onChange={e => update("address", e.target.value)}
            placeholder="Street address"
            className="mt-1.5 h-12 rounded-xl"
          />
        </div>

        {/* Map picker */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Pin Location
          </label>
          <div ref={mapRef} className="mt-1.5 h-48 rounded-xl overflow-hidden border border-border" />
          <p className="text-[10px] text-muted-foreground mt-1">Tap or drag the pin to set location</p>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Description
          </label>
          <Textarea
            value={form.description}
            onChange={e => update("description", e.target.value)}
            placeholder="Tell families what to expect..."
            className="mt-1.5 rounded-xl min-h-[100px]"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Photos
          </label>
          <div className="mt-1.5 flex gap-2 flex-wrap">
            {photos.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            <label className={`w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Add Photo</span>
                </>
              )}
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
            {photos.length === 0 && !uploading && (
              <p className="text-[10px] text-muted-foreground self-end pb-1">Tap to add up to 10 photos</p>
            )}
          </div>
        </div>

        {/* Free toggle */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-border">
          <div>
            <p className="font-semibold text-sm">Free Event</p>
            <p className="text-xs text-muted-foreground">No cost to attend</p>
          </div>
          <Switch checked={form.is_free} onCheckedChange={v => update("is_free", v)} />
        </div>

        {!form.is_free && (
          <Input
            value={form.price_info}
            onChange={e => update("price_info", e.target.value)}
            placeholder="Price info (e.g. $10 adults, $5 kids)"
            className="h-12 rounded-xl"
          />
        )}

        {/* Age Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Min Age
            </label>
            <Input
              type="number"
              min={0}
              max={18}
              value={form.age_min}
              onChange={e => update("age_min", parseInt(e.target.value) || 0)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Max Age
            </label>
            <Input
              type="number"
              min={0}
              max={18}
              value={form.age_max}
              onChange={e => update("age_max", parseInt(e.target.value) || 0)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Holiday */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Holiday (optional)
          </label>
          <Select value={form.holiday} onValueChange={v => update("holiday", v)}>
            <SelectTrigger className="mt-1.5 h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(HOLIDAY_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Website */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Website URL
          </label>
          <Input
            value={form.website_url}
            onChange={e => update("website_url", e.target.value)}
            placeholder="https://..."
            className="mt-1.5 h-12 rounded-xl"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 rounded-full font-heading font-bold text-lg shadow-lg shadow-primary/20"
        >
          {submitting ? "Posting..." : "Submit Event 🎉"}
        </Button>
      </div>
    </div>
  );
}
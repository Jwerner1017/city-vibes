export type EventCategory =
  | "festival"
  | "outdoor"
  | "sports"
  | "arts"
  | "music"
  | "food"
  | "holiday"
  | "community"
  | "education"
  | "attraction"
  | "trick_or_treat"
  | "fireworks"
  | "santa"
  | "easter"
  | "parade"
  | "other";

export type HolidayKey =
  | "none"
  | "july_4th"
  | "halloween"
  | "christmas"
  | "easter"
  | "st_patricks"
  | "thanksgiving"
  | "new_years"
  | "valentines"
  | "memorial_day"
  | "labor_day";

export type City = {
  id: number;
  name: string;
  state: string;
  state_code: string;
  latitude: number;
  longitude: number;
  zoom: number;
  ranking: number;
  is_active: boolean;
  description: string | null;
  last_synced_at: string | null;
};

export type EventItem = {
  id: number;
  city_id: number | null;
  title: string;
  description: string | null;
  date_start: string;
  date_end: string | null;
  location_name: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  category: EventCategory;
  holiday: HolidayKey;
  photos: string[];
  is_free: boolean;
  price_info: string | null;
  age_min: number;
  age_max: number;
  is_permanent: boolean;
  website_url: string | null;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  source: string | null;
  is_running_event?: boolean;
  range_end?: string | null;
};

export type Neighborhood = {
  id: number;
  name: string;
  description: string | null;
  city_id: number;
  latitude: number;
  longitude: number;
  radius_miles: number;
  vibe: string | null;
  is_active: boolean;
};

export type EventFilters = {
  category?: EventCategory | null;
  holiday?: HolidayKey | null;
  is_free?: boolean | null;
  window?: "tonight" | "weekend" | "week" | "all" | null;
  age_min?: number | null;
  age_max?: number | null;
};

export type SyncResult = {
  skipped?: boolean;
  reason?: string;
  job?: string;
  cities: Array<{
    city: string;
    synced: number;
    updated: number;
    found: number;
    sources: Record<string, number>;
    error?: string;
  }>;
  next_batch: number;
};

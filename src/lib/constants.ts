import type { EventCategory, HolidayKey } from "./types";
import {
  Flag,
  Trees,
  Trophy,
  Palette,
  Music,
  UtensilsCrossed,
  Gift,
  Users,
  GraduationCap,
  Landmark,
  Ghost,
  Sparkles,
  Egg,
  MapPin,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = "City Vibes";
export const DEFAULT_CITY = {
  name: "Louisville",
  state: "Kentucky",
  state_code: "KY",
  latitude: 38.2527,
  longitude: -85.7585,
  zoom: 11,
} as const;

export const RADIUS_MILES = 50;

export const CATEGORY_CONFIG: Record<
  EventCategory,
  { label: string; icon: LucideIcon; colorClass: string; token: string }
> = {
  festival: { label: "Festival", icon: PartyPopper, colorClass: "bg-cat-festival", token: "var(--color-cat-festival)" },
  outdoor: { label: "Outdoor", icon: Trees, colorClass: "bg-cat-outdoor", token: "var(--color-cat-outdoor)" },
  sports: { label: "Sports", icon: Trophy, colorClass: "bg-cat-sports", token: "var(--color-cat-sports)" },
  arts: { label: "Arts", icon: Palette, colorClass: "bg-cat-arts", token: "var(--color-cat-arts)" },
  music: { label: "Music", icon: Music, colorClass: "bg-cat-music", token: "var(--color-cat-music)" },
  food: { label: "Food", icon: UtensilsCrossed, colorClass: "bg-cat-food", token: "var(--color-cat-food)" },
  holiday: { label: "Holiday", icon: Gift, colorClass: "bg-cat-holiday", token: "var(--color-cat-holiday)" },
  community: { label: "Community", icon: Users, colorClass: "bg-cat-community", token: "var(--color-cat-community)" },
  education: { label: "Learn", icon: GraduationCap, colorClass: "bg-cat-education", token: "var(--color-cat-education)" },
  attraction: { label: "Attraction", icon: Landmark, colorClass: "bg-cat-attraction", token: "var(--color-cat-attraction)" },
  trick_or_treat: { label: "Trick-or-treat", icon: Ghost, colorClass: "bg-cat-halloween", token: "var(--color-cat-halloween)" },
  fireworks: { label: "Fireworks", icon: Sparkles, colorClass: "bg-cat-fireworks", token: "var(--color-cat-fireworks)" },
  santa: { label: "Santa", icon: Gift, colorClass: "bg-cat-holiday", token: "var(--color-cat-holiday)" },
  easter: { label: "Easter", icon: Egg, colorClass: "bg-cat-easter", token: "var(--color-cat-easter)" },
  parade: { label: "Parade", icon: Flag, colorClass: "bg-cat-parade", token: "var(--color-cat-parade)" },
  other: { label: "Other", icon: MapPin, colorClass: "bg-cat-other", token: "var(--color-cat-other)" },
};

export const HOLIDAY_CONFIG: Record<
  HolidayKey,
  { label: string; colorClass: string }
> = {
  none: { label: "None", colorClass: "bg-muted" },
  july_4th: { label: "July 4th", colorClass: "bg-cat-fireworks" },
  halloween: { label: "Halloween", colorClass: "bg-cat-halloween" },
  christmas: { label: "Christmas", colorClass: "bg-cat-holiday" },
  easter: { label: "Easter", colorClass: "bg-cat-easter" },
  st_patricks: { label: "St. Patrick's", colorClass: "bg-cat-outdoor" },
  thanksgiving: { label: "Thanksgiving", colorClass: "bg-cat-food" },
  new_years: { label: "New Year's", colorClass: "bg-cat-parade" },
  valentines: { label: "Valentine's", colorClass: "bg-cat-holiday" },
  memorial_day: { label: "Memorial Day", colorClass: "bg-cat-fireworks" },
  labor_day: { label: "Labor Day", colorClass: "bg-cat-community" },
};

export const AGE_RANGES = [
  { label: "Babies", min: 0, max: 2 },
  { label: "Toddlers", min: 2, max: 5 },
  { label: "Kids", min: 5, max: 10 },
  { label: "Tweens", min: 10, max: 13 },
  { label: "Teens", min: 13, max: 18 },
  { label: "All ages", min: 0, max: 18 },
] as const;

export const VALID_CATEGORIES = Object.keys(CATEGORY_CONFIG) as EventCategory[];
export const VALID_HOLIDAYS = Object.keys(HOLIDAY_CONFIG) as HolidayKey[];

export const SAVED_KEY = "cityvibes_saved";
export const CITY_KEY = "cityvibes_city";

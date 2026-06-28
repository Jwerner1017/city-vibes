import React from "react";
import { Star, Megaphone, Trophy, Flame, Heart, Shield } from "lucide-react";

// Badge definitions — each has an id, label, description, icon, and colors
export const BADGE_DEFINITIONS = [
  {
    id: "top_supporter",
    label: "Top Supporter",
    description: "Has donated to Local Vibes",
    icon: Heart,
    bg: "bg-yellow-400",
    text: "text-yellow-900",
    ring: "ring-yellow-500",
    emoji: "⭐",
  },
  {
    id: "super_supporter",
    label: "Super Supporter",
    description: "Has made 3+ donations",
    icon: Star,
    bg: "bg-amber-500",
    text: "text-white",
    ring: "ring-amber-600",
    emoji: "🏅",
  },
  {
    id: "event_organizer",
    label: "Event Organizer",
    description: "Has submitted 3+ events",
    icon: Megaphone,
    bg: "bg-primary",
    text: "text-white",
    ring: "ring-primary",
    emoji: "📣",
  },
  {
    id: "prolific_organizer",
    label: "Prolific Organizer",
    description: "Has submitted 10+ events",
    icon: Trophy,
    bg: "bg-purple-600",
    text: "text-white",
    ring: "ring-purple-700",
    emoji: "🏆",
  },
  {
    id: "community_flame",
    label: "Community Flame",
    description: "Top supporter AND active organizer",
    icon: Flame,
    bg: "bg-gradient-to-br from-orange-500 to-rose-600",
    text: "text-white",
    ring: "ring-orange-500",
    emoji: "🔥",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Platform administrator",
    icon: Shield,
    bg: "bg-accent",
    text: "text-white",
    ring: "ring-accent",
    emoji: "🛡️",
  },
];

/**
 * Compute which badges a user earns based on their data.
 * @param {object} opts
 * @param {number} opts.donationCount  - number of completed donations
 * @param {number} opts.eventCount     - number of approved events they created
 * @param {string} opts.role           - user role ("admin" | "user")
 */
export function computeBadges({ donationCount = 0, eventCount = 0, role = "user" }) {
  const earned = [];

  if (role === "admin") earned.push("admin");
  if (donationCount >= 1) earned.push("top_supporter");
  if (donationCount >= 3) earned.push("super_supporter");
  if (eventCount >= 3) earned.push("event_organizer");
  if (eventCount >= 10) earned.push("prolific_organizer");
  if (donationCount >= 1 && eventCount >= 3) earned.push("community_flame");

  return BADGE_DEFINITIONS.filter(b => earned.includes(b.id));
}

/**
 * Renders a horizontal row of badge pills.
 * size: "sm" | "md" (default md)
 */
export default function UserBadges({ badges = [], size = "md" }) {
  if (!badges.length) return null;

  const isSmall = size === "sm";

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map(badge => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.id}
            title={badge.description}
            className={`
              inline-flex items-center gap-1 rounded-full font-semibold
              ${badge.bg} ${badge.text}
              ${isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}
            `}
          >
            <Icon className={isSmall ? "w-2.5 h-2.5" : "w-3 h-3"} />
            {badge.label}
          </div>
        );
      })}
    </div>
  );
}
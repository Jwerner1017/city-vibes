import React from "react";
import { ExternalLink, Tag, Phone, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIER_CONFIG = {
  platinum: { label: "Platinum Sponsor", color: "#e5e4e2", bg: "from-slate-600 to-slate-800", badge: "💎" },
  gold:     { label: "Gold Sponsor",     color: "#FFD700", bg: "from-yellow-600 to-yellow-800", badge: "🥇" },
  silver:   { label: "Silver Sponsor",   color: "#C0C0C0", bg: "from-gray-400 to-gray-600",    badge: "🥈" },
  bronze:   { label: "Bronze Sponsor",   color: "#CD7F32", bg: "from-orange-600 to-orange-800", badge: "🥉" },
};

const CATEGORY_EMOJI = {
  restaurant: "🍽️", retail: "🛍️", entertainment: "🎭", fitness: "💪",
  health: "🏥", education: "📚", services: "🔧", other: "🏢",
};

export default function SponsorCard({ sponsor, onClose }) {
  if (!sponsor) return null;
  const tier = TIER_CONFIG[sponsor.tier] || TIER_CONFIG.bronze;
  const catEmoji = CATEGORY_EMOJI[sponsor.category] || "🏢";

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Header gradient bar */}
      <div className={`bg-gradient-to-r ${tier.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{tier.badge}</span>
          <span className="text-white/90 text-xs font-semibold tracking-wide uppercase">{tier.label}</span>
        </div>
        <span className="text-xl">{catEmoji}</span>
      </div>

      {/* Photo banner */}
      {sponsor.photo_url && (
        <div className="h-28 overflow-hidden">
          <img src={sponsor.photo_url} alt={sponsor.business_name} className="w-full h-full object-cover opacity-80" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Name + logo */}
        <div className="flex items-start gap-3">
          {sponsor.logo_url && (
            <img src={sponsor.logo_url} alt="logo" className="w-10 h-10 rounded-xl object-cover border border-white/20 flex-shrink-0" />
          )}
          <div>
            <h3 className="font-heading font-black text-white text-base leading-tight">{sponsor.business_name}</h3>
            {sponsor.tagline && <p className="text-white/60 text-xs mt-0.5">{sponsor.tagline}</p>}
          </div>
        </div>

        {/* Discount highlight */}
        {sponsor.discount_title && (
          <div className="bg-gradient-to-r from-green-900/60 to-emerald-900/60 border border-green-500/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-bold uppercase tracking-wide">Family Discount</span>
            </div>
            <p className="text-white font-semibold text-sm">{sponsor.discount_title}</p>
            {sponsor.discount_description && (
              <p className="text-white/70 text-xs mt-1">{sponsor.discount_description}</p>
            )}
            {sponsor.discount_code && (
              <div className="mt-2 bg-black/30 rounded-lg px-3 py-1.5 inline-block">
                <span className="text-green-300 font-mono text-xs font-bold tracking-widest">Code: {sponsor.discount_code}</span>
              </div>
            )}
            {sponsor.discount_expiry && (
              <p className="text-white/40 text-xs mt-1.5">Expires: {new Date(sponsor.discount_expiry).toLocaleDateString()}</p>
            )}
          </div>
        )}

        {/* Info */}
        <div className="space-y-1.5">
          {sponsor.address && (
            <div className="flex items-start gap-2 text-white/60 text-xs">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <span>{sponsor.address}</span>
            </div>
          )}
          {sponsor.phone && (
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Phone className="w-3.5 h-3.5 flex-shrink-0 text-accent" />
              <a href={`tel:${sponsor.phone}`} className="hover:text-white transition-colors">{sponsor.phone}</a>
            </div>
          )}
        </div>

        {/* CTA */}
        {sponsor.website_url && (
          <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white text-sm h-9 gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Visit Website
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
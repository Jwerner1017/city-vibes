import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Search, Star } from "lucide-react";
import SponsorCard from "@/components/SponsorCard";
import BottomNav from "@/components/BottomNav";

const TIER_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "restaurant", label: "🍽️ Restaurant" },
  { id: "retail", label: "🛍️ Retail" },
  { id: "entertainment", label: "🎭 Entertainment" },
  { id: "fitness", label: "💪 Fitness" },
  { id: "health", label: "🏥 Health" },
  { id: "education", label: "📚 Education" },
  { id: "services", label: "🔧 Services" },
  { id: "other", label: "🏢 Other" },
];

export default function SponsorDirectory() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Sponsor.filter({ status: "active" }, "-tier", 200);
      setSponsors(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return sponsors
      .filter(s => (category === "all" ? true : s.category === category))
      .filter(s => (query ? s.business_name.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => (TIER_ORDER[a.tier] ?? 4) - (TIER_ORDER[b.tier] ?? 4));
  }, [sponsors, query, category]);

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/95 backdrop-blur-lg border-b border-white/10 z-20">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/" className="p-1">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="font-heading font-black text-lg text-white">Sponsor Directory</h1>
            <p className="text-white/50 text-xs">Family-friendly local businesses supporting City Vibes</p>
          </div>
        </div>

        <div className="px-4 pb-3 space-y-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search businesses..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                  category === c.id ? "bg-primary text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No sponsors found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {filtered.map(sponsor => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
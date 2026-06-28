import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BottomNav from "@/components/BottomNav";
import { User, Heart, Shield, LogOut, ChevronRight, Star, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const d = await base44.entities.Donation.filter({ status: "completed" });
        setDonations(d);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout("/");
  };

  const isSupporter = donations.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-br from-primary to-accent px-4 pt-8 pb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-black text-xl text-white flex items-center gap-2">
              {user?.full_name || "Local Viber"}
              {isSupporter && (
                <Badge className="bg-yellow-400 text-yellow-900 border-0 text-[10px]">
                  <Star className="w-3 h-3 mr-0.5 fill-current" /> Supporter
                </Badge>
              )}
            </h1>
            <p className="text-white/70 text-xs">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-3">
        {/* Support Local Vibes */}
        <Link to="/donate" className="block">
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base">❤️ Support Local Vibes</h3>
                <p className="text-white/80 text-xs mt-0.5">Help us keep Louisville connected</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>
          </div>
        </Link>

        {/* Menu items */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <Link to="/organizer" className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Organizer Dashboard</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link to="/saved" className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-sm">Saved Events</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {user?.role === "admin" && (
            <Link to="/moderation" className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent" />
                <span className="font-semibold text-sm">Moderation Queue</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full rounded-xl h-12 gap-2 text-destructive border-destructive/20"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
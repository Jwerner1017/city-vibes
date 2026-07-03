import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BottomNav from "@/components/BottomNav";
import { User, Heart, Shield, LogOut, ChevronRight, BarChart3, Store, MessageSquarePlus, Star, MapPin, Trash2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserBadges, { computeBadges } from "@/components/UserBadges";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const [d, evs] = await Promise.all([
          base44.entities.Donation.filter({ status: "completed" }),
          base44.entities.Event.filter({ created_by_id: me.id }),
        ]);
        setDonations(d);
        setMyEvents(evs);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout("/");
  };

  const handleDeleteAccount = async () => {
    await base44.auth.logout();
    localStorage.clear();
    toast({ title: "Account deleted", description: "Your account and data access have been removed." });
    navigate("/");
  };

  const badges = computeBadges({
    donationCount: donations.length,
    eventCount: myEvents.length,
    role: user?.role,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-br from-primary to-accent px-4 pt-8 pb-12 safe-top">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-black text-xl text-white">
              {user?.full_name || "City Viber"}
            </h1>
            <p className="text-white/70 text-xs mb-1.5">{user?.email}</p>
            <UserBadges badges={badges} size="sm" />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-3">
        {/* Stats + Badge Showcase */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="font-heading font-black text-2xl text-primary">{myEvents.length}</p>
              <p className="text-xs text-muted-foreground font-medium">Events Created</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="font-heading font-black text-2xl text-secondary">{donations.length}</p>
              <p className="text-xs text-muted-foreground font-medium">Donations Made</p>
            </div>
          </div>
          {badges.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Badges</p>
              <div className="flex flex-wrap gap-2">
                {badges.map(badge => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.id} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/40 flex-1 min-w-[80px]">
                      <div className={`w-10 h-10 rounded-full ${badge.bg} flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-5 h-5 ${badge.text}`} />
                      </div>
                      <span className="text-[10px] font-bold text-foreground text-center leading-tight">{badge.label}</span>
                      <span className="text-[9px] text-muted-foreground text-center leading-tight">{badge.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">Create events or donate to earn badges! 🏅</p>
            </div>
          )}
        </div>

        {/* Support City Vibes */}
        <Link to="/donate" className="block">
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base">❤️ Support City Vibes</h3>
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

          <Link to="/switch-city" className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-sm">Switch City</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link to="/neighborhoods" className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-teal-500" />
              <span className="font-semibold text-sm">Neighborhood Guide</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link to="/sponsor-directory" className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-sm">Sponsor Directory</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link to="/event-reviews" className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <MessageSquarePlus className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Event Reviews</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link to="/become-a-sponsor" className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-sm">Become a Sponsor</span>
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 gap-2 text-white bg-destructive hover:bg-destructive/90 border-destructive"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account, all your submitted events, reviews, and interaction history. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <BottomNav />
    </div>
  );
}
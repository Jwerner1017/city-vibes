import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Heart, Star, Check, Zap, Shield, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const ONE_TIME = [
  {
    amount: 5,
    label: "$5",
    emoji: "☕",
    tagline: "Buy us a coffee",
    description: "A small gesture with a big impact — keeps our servers humming.",
  },
  {
    amount: 10,
    label: "$10",
    emoji: "🎉",
    tagline: "Fuel the features",
    description: "Helps us ship new event tools and city coverage.",
  },
  {
    amount: 20,
    label: "$20",
    emoji: "🌟",
    tagline: "Power a month",
    description: "Covers real operating costs so we stay free for families.",
  },
];

const MONTHLY = [
  {
    amount: 2.99,
    label: "$2.99/mo",
    name: "Friend",
    emoji: "🤝",
    perks: ["Supporter badge on your profile", "Our deepest gratitude"],
    color: "from-blue-500 to-cyan-400",
  },
  {
    amount: 4.99,
    label: "$4.99/mo",
    name: "Champion",
    emoji: "🏆",
    perks: ["Champion badge", "Early access to new features", "Priority support"],
    color: "from-orange-500 to-amber-400",
    popular: true,
  },
  {
    amount: 9.99,
    label: "$9.99/mo",
    name: "Hero",
    emoji: "🦸",
    perks: ["Hero badge", "Early access + priority support", "Name in our community credits"],
    color: "from-purple-600 to-pink-500",
  },
];

const IMPACT_STATS = [
  { icon: Globe, value: "200+", label: "Cities Covered" },
  { icon: Zap, value: "Free", label: "Always & Forever" },
  { icon: Shield, value: "Community", label: "Powered & Trusted" },
];

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export default function Donate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState("one_time");
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDonate = async () => {
    if (!selected) return;

    if (isInIframe()) {
      toast({
        title: "Open the published app",
        description: "Checkout only works from the published app — not the preview.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const currentUrl = window.location.origin;
      const response = await base44.functions.invoke("createDonationCheckout", {
        amount: selected.amount,
        type: tab,
        tier_name: selected.name || "One-time",
        success_url: `${currentUrl}/donate?success=true`,
        cancel_url: `${currentUrl}/donate`,
      });

      if (response.data?.url) {
        // Save a record locally before redirecting
        await base44.entities.Donation.create({
          amount: selected.amount,
          type: tab,
          tier_name: selected.name || "One-time",
          status: "pending",
        });
        window.location.href = response.data.url;
      } else {
        throw new Error(response.data?.error || "Could not create checkout session");
      }
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: err.message,
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  // Handle success redirect from Stripe
  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get("success") === "true";

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/30">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="font-heading font-black text-3xl mb-2">You're a Legend! 🎉</h1>
          <p className="text-muted-foreground mb-2 leading-relaxed">
            Your generosity directly fuels the features, updates, and infrastructure that keep City Vibes alive and thriving.
          </p>
          <p className="text-sm text-muted-foreground mb-7">
            We'll put every dollar to work — promise.
          </p>
          <div className="flex items-center justify-center gap-2 mb-7 bg-yellow-50 border border-yellow-200 rounded-2xl py-3 px-4">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-sm text-yellow-800">Supporter badge unlocked!</span>
          </div>
          <Button onClick={() => navigate("/")} className="rounded-full px-10 h-12 font-heading font-bold text-base shadow-lg shadow-primary/20">
            Back to City Vibes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 pt-4 pb-10 overflow-hidden">
        {/* Decorative glow blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <button
          onClick={() => navigate(-1)}
          className="relative w-11 h-11 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl shadow-lg shadow-orange-500/30 mb-4">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>

          <h1 className="font-heading font-black text-3xl text-white mb-3">
            Support City Vibes
          </h1>

          {/* Mission Statement */}
          <p className="text-white/90 text-base font-medium leading-relaxed max-w-xs mx-auto mb-2">
            Your city deserves to stay connected.
          </p>
          <p className="text-white/65 text-sm leading-relaxed max-w-sm mx-auto">
            City Vibes is 100% community-funded. Every donation goes directly toward new features, city expansions, server costs, and keeping this platform free for every family — no paywalls, no ads, no catches.
          </p>

          {/* Impact stats */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {IMPACT_STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <Icon className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{value}</p>
                <p className="text-white/50 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">

          {/* Tabs */}
          <div className="flex bg-muted/60 p-1 m-4 rounded-full">
            <button
              onClick={() => { setTab("one_time"); setSelected(null); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold font-heading transition-all ${
                tab === "one_time" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              One-Time Gift
            </button>
            <button
              onClick={() => { setTab("monthly"); setSelected(null); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold font-heading transition-all ${
                tab === "monthly" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly Vibe ✨
            </button>
          </div>

          <div className="px-4 pb-4">
            {tab === "one_time" ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Every dollar goes directly to platform development & operations.
                </p>
                {ONE_TIME.map(opt => (
                  <button
                    key={opt.amount}
                    onClick={() => setSelected(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                      selected?.amount === opt.amount
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black font-heading text-xl">{opt.label}</span>
                          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{opt.tagline}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected?.amount === opt.amount ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {selected?.amount === opt.amount && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Become a sustaining member. Cancel anytime — no strings attached.
                </p>
                {MONTHLY.map(opt => (
                  <button
                    key={opt.amount}
                    onClick={() => setSelected(opt)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all relative ${
                      selected?.amount === opt.amount
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    {opt.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-orange-500 to-amber-400 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
                          ⭐ Most Popular
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 bg-gradient-to-br ${opt.color} rounded-xl flex items-center justify-center shadow-sm`}>
                          <span className="text-xl">{opt.emoji}</span>
                        </div>
                        <div>
                          <p className="font-black font-heading text-base">{opt.name}</p>
                          <p className="text-primary font-bold text-lg leading-tight">{opt.label}</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                        selected?.amount === opt.amount ? "bg-primary border-primary" : "border-border"
                      }`}>
                        {selected?.amount === opt.amount && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <ul className="mt-2.5 ml-14 space-y-0.5">
                      {opt.perks.map(perk => (
                        <li key={perk} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={handleDonate}
              disabled={!selected || submitting}
              className="w-full h-14 rounded-full font-heading font-bold text-lg mt-5 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {submitting
                ? "Redirecting to checkout..."
                : selected
                  ? `${tab === "monthly" ? "Subscribe" : "Donate"} ${selected.label} →`
                  : "Choose an amount above"}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Secure checkout powered by Stripe. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Trust block */}
        <div className="mt-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-center">
          <p className="text-white font-heading font-black text-base mb-1">
            Where does my money go? 🤔
          </p>
          <p className="text-white/65 text-xs leading-relaxed">
            100% of contributions fund platform hosting, new city coverage, feature development, and keeping City Vibes completely free for every community. We publish transparent updates so you always know your impact.
          </p>
        </div>
      </div>
    </div>
  );
}
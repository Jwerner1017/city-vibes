import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Heart, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const ONE_TIME = [
  { amount: 5, label: "$5", emoji: "☕" },
  { amount: 10, label: "$10", emoji: "🎉" },
  { amount: 20, label: "$20", emoji: "🌟" },
];

const MONTHLY = [
  { amount: 2.99, label: "$2.99/mo", name: "Friend", emoji: "🤝", perks: "Supporter badge" },
  { amount: 4.99, label: "$4.99/mo", name: "Champion", emoji: "🏆", perks: "Badge + early access to features" },
  { amount: 9.99, label: "$9.99/mo", name: "Hero", emoji: "🦸", perks: "Badge + early access + priority support" },
];

export default function Donate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState("one_time");
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDonate = async () => {
    if (!selected) return;
    setSubmitting(true);
    await base44.entities.Donation.create({
      amount: selected.amount,
      type: tab,
      tier_name: selected.name || "One-time",
      status: "completed",
    });
    setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-heading font-black text-2xl mb-2">Thank You! 🎉</h1>
          <p className="text-muted-foreground mb-6">
            Your support keeps Local Vibes alive for Louisville families.
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-sm">You've earned the Supporter badge!</span>
          </div>
          <Button onClick={() => navigate("/")} className="rounded-full px-8 h-12 font-heading font-bold">
            Back to Local Vibes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="relative bg-gradient-to-br from-orange-400 to-pink-500 px-4 pt-4 pb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <Heart className="w-10 h-10 text-white mx-auto mb-2" />
          <h1 className="font-heading font-black text-2xl text-white">Support Local Vibes</h1>
          <p className="text-white/80 text-sm mt-1">Help us keep Louisville families connected</p>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex bg-muted rounded-full p-0.5 mb-5">
            <button
              onClick={() => { setTab("one_time"); setSelected(null); }}
              className={`flex-1 py-2 rounded-full text-sm font-bold font-heading transition-all ${tab === "one_time" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
            >
              One-Time
            </button>
            <button
              onClick={() => { setTab("monthly"); setSelected(null); }}
              className={`flex-1 py-2 rounded-full text-sm font-bold font-heading transition-all ${tab === "monthly" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
          </div>

          {tab === "one_time" ? (
            <div className="space-y-3">
              {ONE_TIME.map(opt => (
                <button
                  key={opt.amount}
                  onClick={() => setSelected(opt)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selected?.amount === opt.amount
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="font-bold font-heading text-lg">{opt.label}</span>
                  </div>
                  {selected?.amount === opt.amount && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {MONTHLY.map(opt => (
                <button
                  key={opt.amount}
                  onClick={() => setSelected(opt)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selected?.amount === opt.amount
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <p className="font-bold font-heading">{opt.name}</p>
                        <p className="text-lg font-bold text-primary">{opt.label}</p>
                      </div>
                    </div>
                    {selected?.amount === opt.amount && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-11">{opt.perks}</p>
                </button>
              ))}
            </div>
          )}

          <Button
            onClick={handleDonate}
            disabled={!selected || submitting}
            className="w-full h-14 rounded-full font-heading font-bold text-lg mt-5 shadow-lg shadow-primary/20"
          >
            {submitting ? "Processing..." : selected ? `Donate ${selected.label}` : "Select an amount"}
          </Button>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shown after returning from checkout. The payment is confirmed with the server before thanking anyone.
export default function DonationResult({ sessionId }) {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    base44.functions.invoke("verifyDonation", { session_id: sessionId })
      .then((res) => setResult(res.data))
      .catch(() => setResult({ paid: false }));
  }, [sessionId]);

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 p-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Confirming your donation...</p>
      </div>
    );
  }

  if (!result.paid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-14 h-14 text-secondary mx-auto mb-4" />
          <h1 className="font-heading font-black text-2xl mb-2">We couldn't confirm a payment</h1>
          <p className="text-muted-foreground mb-7 leading-relaxed">
            No charge shows as completed for this checkout. If you were charged, it can take a minute to appear. Refresh this page to check again.
          </p>
          <Button onClick={() => navigate("/donate")} className="rounded-full px-10 h-12 font-heading font-bold text-base">
            Back to Donate
          </Button>
        </div>
      </div>
    );
  }

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
        <p className="text-sm text-muted-foreground mb-7">We'll put every dollar to work, promise.</p>
        {result.badge && (
          <div className="flex items-center justify-center gap-2 mb-7 bg-secondary/10 border border-secondary/30 rounded-2xl py-3 px-4">
            <Star className="w-5 h-5 text-secondary fill-secondary" />
            <span className="font-bold text-sm">Supporter badge unlocked!</span>
          </div>
        )}
        <Button onClick={() => navigate("/")} className="rounded-full px-10 h-12 font-heading font-bold text-base shadow-lg shadow-primary/20">
          Back to City Vibes
        </Button>
      </div>
    </div>
  );
}
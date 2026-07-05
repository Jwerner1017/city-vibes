import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Facebook, Instagram } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function Contact() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-border z-20 safe-top">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-heading font-bold text-base">Contact</h2>
        </div>
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="font-heading font-black text-2xl mb-2">Contact Us</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Have a question, found an issue, or want to share feedback? We'd love to hear from you.
        </p>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <a
            href="mailto:hello@cityvibes.app"
            className="flex items-center gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Email Us</p>
              <p className="text-xs text-muted-foreground">hello@cityvibes.app</p>
            </div>
          </a>

          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center flex-shrink-0">
              <Facebook className="w-5 h-5 text-[#1877F2]" />
            </div>
            <div>
              <p className="font-semibold text-sm">Facebook</p>
              <p className="text-xs text-muted-foreground">Message us on Facebook</p>
            </div>
          </a>

          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E1306C]/10 flex items-center justify-center flex-shrink-0">
              <Instagram className="w-5 h-5 text-[#E1306C]" />
            </div>
            <div>
              <p className="font-semibold text-sm">Instagram</p>
              <p className="text-xs text-muted-foreground">Follow and DM us</p>
            </div>
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
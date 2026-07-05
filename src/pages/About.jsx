import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-border z-20 safe-top">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-heading font-bold text-base">About</h2>
        </div>
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="font-heading font-black text-2xl mb-4">About City Vibes</h1>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            City Vibes is a community events platform built to help families and neighbors discover
            what's happening around their city. From festivals and outdoor concerts to farmers markets,
            holiday celebrations, and free community gatherings, City Vibes brings every local happening
            into one easy-to-browse map, calendar, and list so you never miss out on the fun.
          </p>
          <p>
            Our app is designed for busy parents, young families, and anyone who loves exploring their
            city. You can filter events by category, age range, price, and holiday, save the ones you're
            interested in, mark yourself as "going," and even sync events straight to your personal Google
            Calendar. Local organizers and small businesses can also post their own events and offers,
            making it simple for the whole community to stay connected and support one another.
          </p>
          <p>
            City Vibes is built and maintained by a small, independent team of local residents who are
            passionate about strengthening community connections. We partner with local sponsors and rely
            on support from users like you to keep the platform free, accurate, and growing to new cities
            over time. Thank you for being part of the City Vibes community!
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
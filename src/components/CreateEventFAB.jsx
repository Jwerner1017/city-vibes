import React from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreateEventFAB() {
  return (
    <Link
      to="/create-event"
      className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-secondary text-white rounded-full shadow-lg shadow-secondary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
    >
      <Plus className="w-7 h-7" strokeWidth={2.5} />
    </Link>
  );
}
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Map, Ghost, Heart, User } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Map, label: "Map" },
  { path: "/holidays", icon: Ghost, label: "Holidays" },
  { path: "/saved", icon: Heart, label: "Saved" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-border z-50 safe-bottom select-none">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  navigate(path, { replace: true });
                }
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
              <span className={`text-[10px] font-semibold ${isActive ? "font-bold" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
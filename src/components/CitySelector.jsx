import React, { useState, useRef, useEffect, useMemo } from "react";
import { MapPin, ChevronDown, Search, X, Check } from "lucide-react";
import { useCity } from "@/lib/CityContext";
import { motion, AnimatePresence } from "framer-motion";

export default function CitySelector() {
  const { cities, selectedCity, setSelectedCity } = useCity();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
        setSelectedState(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const states = useMemo(() => {
    const stateMap = {};
    cities.forEach(c => {
      if (!stateMap[c.state_code]) stateMap[c.state_code] = { code: c.state_code, name: c.state, cities: [] };
      stateMap[c.state_code].cities.push(c);
    });
    return Object.values(stateMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [cities]);

  const filteredCities = useMemo(() => {
    const q = query.toLowerCase();
    if (!q && !selectedState) return [];
    return cities.filter(c => {
      const matchState = selectedState ? c.state_code === selectedState : true;
      const matchQuery = q ? (c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || c.state_code.toLowerCase().includes(q)) : true;
      return matchState && matchQuery;
    }).sort((a, b) => a.state.localeCompare(b.state) || (a.ranking || 0) - (b.ranking || 0));
  }, [cities, query, selectedState]);

  const handleSelect = (city) => {
    setSelectedCity(city);
    setOpen(false);
    setQuery("");
    setSelectedState(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 group"
      >
        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
          <MapPin className="w-2.5 h-2.5 text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground/80 group-hover:text-primary transition-colors max-w-[140px] truncate">
          {selectedCity ? `${selectedCity.name}, ${selectedCity.state_code}` : "Select City"}
        </span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-border z-[9999] overflow-hidden"
            style={{ maxHeight: "420px" }}
          >
            {/* Search */}
            <div className="p-3 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-border shadow-sm">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search city or state..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedState(null); }}
                  className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                />
                {(query || selectedState) && (
                  <button onClick={() => { setQuery(""); setSelectedState(null); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "340px" }}>
              {/* Search results */}
              {(query || selectedState) ? (
                filteredCities.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">No cities found</div>
                ) : (
                  <div className="p-2">
                    {filteredCities.map(city => (
                      <button
                        key={city.id}
                        onClick={() => handleSelect(city)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{city.name}</p>
                            <p className="text-xs text-muted-foreground">{city.state}</p>
                          </div>
                        </div>
                        {selectedCity?.id === city.id && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )
              ) : (
                /* State list browse */
                <div className="p-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5">Browse by State</p>
                  {states.map(state => (
                    <button
                      key={state.code}
                      onClick={() => setSelectedState(state.code)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-7 bg-primary/10 text-primary text-xs font-bold rounded-md flex items-center justify-center flex-shrink-0">
                          {state.code}
                        </span>
                        <span className="text-sm font-medium text-foreground">{state.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{state.cities.length} cities</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
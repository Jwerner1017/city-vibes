import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Search, X, Check } from "lucide-react";
import { useCity } from "@/lib/CityContext";
import BottomNav from "@/components/BottomNav";

export default function SwitchCity() {
  const navigate = useNavigate();
  const { cities, selectedCity, setSelectedCity } = useCity();
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState(null);

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
    return cities
      .filter(c => (selectedState ? c.state_code === selectedState : true))
      .filter(c => (q ? c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || c.state_code.toLowerCase().includes(q) : true))
      .sort((a, b) => a.state.localeCompare(b.state) || (a.ranking || 0) - (b.ranking || 0));
  }, [cities, query, selectedState]);

  const handleSelect = (city) => {
    setSelectedCity(city);
    navigate("/");
  };

  const showList = query || selectedState;

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="sticky top-0 bg-gray-950/95 backdrop-blur-lg border-b border-white/10 z-20">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/" className="p-1">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="font-heading font-black text-lg text-white">Switch City</h1>
            <p className="text-white/50 text-xs">
              Currently viewing{" "}
              <span className="text-primary font-semibold">
                {selectedCity ? `${selectedCity.name}, ${selectedCity.state_code}` : "no city selected"}
              </span>
            </p>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedState(null); }}
              placeholder="Search city or state..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            {(query || selectedState) && (
              <button onClick={() => { setQuery(""); setSelectedState(null); }} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto">
        {showList ? (
          filteredCities.length === 0 ? (
            <p className="text-center text-white/40 text-sm py-12">No cities found</p>
          ) : (
            <div className="space-y-2">
              {filteredCities.map(city => (
                <button
                  key={city.id}
                  onClick={() => handleSelect(city)}
                  className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{city.name}</p>
                      <p className="text-xs text-white/50">{city.state}</p>
                    </div>
                  </div>
                  {selectedCity?.id === city.id && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-1 py-1.5">Browse by State</p>
            {states.map(state => (
              <button
                key={state.code}
                onClick={() => setSelectedState(state.code)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-11 h-8 bg-primary/20 text-primary text-xs font-bold rounded-lg flex items-center justify-center flex-shrink-0">
                    {state.code}
                  </span>
                  <span className="text-sm font-medium text-white">{state.name}</span>
                </div>
                <span className="text-xs text-white/40">{state.cities.length} cities</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
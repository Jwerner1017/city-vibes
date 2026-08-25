import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { City } from "@/lib/types";
import { CITY_KEY, DEFAULT_CITY } from "@/lib/constants";

type Ctx = {
  cities: City[];
  selectedCity: City;
  setSelectedCity: (city: City) => void;
};

const CityContext = createContext<Ctx | null>(null);

const FALLBACK: City = {
  id: 0,
  name: DEFAULT_CITY.name,
  state: DEFAULT_CITY.state,
  state_code: DEFAULT_CITY.state_code,
  latitude: DEFAULT_CITY.latitude,
  longitude: DEFAULT_CITY.longitude,
  zoom: DEFAULT_CITY.zoom,
  ranking: 1,
  is_active: true,
  description: null,
  last_synced_at: null,
};

export function CityProvider({
  cities,
  children,
}: {
  cities: City[];
  children: ReactNode;
}) {
  const [selectedCity, setSelectedCityState] = useState<City>(() => {
    return cities.find((c) => c.name === "Louisville") ?? cities[0] ?? FALLBACK;
  });

  useEffect(() => {
    const saved = localStorage.getItem(CITY_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { id?: number; name?: string };
      const match =
        cities.find((c) => c.id === parsed.id) ||
        cities.find((c) => c.name === parsed.name);
      if (match) setSelectedCityState(match);
    } catch {
      localStorage.removeItem(CITY_KEY);
    }
  }, [cities]);

  const setSelectedCity = (city: City) => {
    setSelectedCityState(city);
    localStorage.setItem(CITY_KEY, JSON.stringify({ id: city.id, name: city.name }));
  };

  const value = useMemo(
    () => ({
      cities,
      selectedCity: selectedCity.id ? selectedCity : (cities[0] ?? FALLBACK),
      setSelectedCity,
    }),
    [cities, selectedCity],
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within CityProvider");
  return ctx;
}

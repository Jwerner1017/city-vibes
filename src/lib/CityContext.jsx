import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const CityContext = createContext(null);

const DEFAULT_CITY = {
  id: "__default__",
  name: "Louisville",
  state: "Kentucky",
  state_code: "KY",
  latitude: 38.2527,
  longitude: -85.7585,
  zoom: 11,
};

export function CityProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCityState] = useState(null);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("localvibes_city");
    if (saved) {
      try { setSelectedCityState(JSON.parse(saved)); } catch {}
    }
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await base44.entities.City.filter({ is_active: true }, "state_code", 300);
      setCities(data);
      const saved = localStorage.getItem("localvibes_city");
      if (!saved && data.length > 0) {
        const lou = data.find(c => c.name === "Louisville") || data[0];
        setSelectedCityState(lou);
        localStorage.setItem("localvibes_city", JSON.stringify(lou));
      }
    } catch {
      setSelectedCityState(DEFAULT_CITY);
    } finally {
      setLoadingCities(false);
    }
  };

  const setSelectedCity = (city) => {
    setSelectedCityState(city);
    localStorage.setItem("localvibes_city", JSON.stringify(city));
  };

  const activeCity = selectedCity || DEFAULT_CITY;

  return (
    <CityContext.Provider value={{ cities, selectedCity: activeCity, setSelectedCity, loadingCities }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within CityProvider");
  return ctx;
}
import { ChevronDown, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCity } from "./city-provider";

export function CitySelector({ hideName = false }: { hideName?: boolean }) {
  const { selectedCity } = useCity();
  return (
    <Link
      to="/cities"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-fg"
    >
      <MapPin className="size-3.5" />
      {hideName ? (
        <span className="font-medium text-fg">{selectedCity.state_code}</span>
      ) : (
        <span className="font-medium text-fg">
          {selectedCity.name}
          <span className="text-muted-foreground">, {selectedCity.state_code}</span>
        </span>
      )}
      <ChevronDown className="size-3.5" />
    </Link>
  );
}

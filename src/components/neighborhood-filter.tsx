import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function NeighborhoodFilter({
  options,
  value,
  onChange,
}: {
  options: Array<[name: string, count: number]>;
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div
      className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 pb-2"
      aria-label="Filter by neighborhood"
    >
      <MapPin className="size-4 shrink-0 text-primary" />
      <Pill active={!value} onClick={() => onChange(null)}>
        All areas
      </Pill>
      {options.map(([name, count]) => (
        <Pill key={name} active={value === name} onClick={() => onChange(value === name ? null : name)}>
          {name}
          <span className="tabular-nums opacity-70">{count}</span>
        </Pill>
      ))}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-surface text-muted-foreground shadow-[var(--shadow-border)]",
      )}
    >
      {children}
    </button>
  );
}
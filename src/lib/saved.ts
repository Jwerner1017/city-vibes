import { SAVED_KEY } from "./constants";

function read(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed = raw ? (JSON.parse(raw) as number[]) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("cityvibes-saved"));
}

export function getSavedIds(): number[] {
  return read();
}

export function isSaved(id: number): boolean {
  return read().includes(id);
}

export function toggleSaved(id: number): boolean {
  const ids = read();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  write(next);
  return next.includes(id);
}

export function subscribeSaved(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("cityvibes-saved", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("cityvibes-saved", handler);
    window.removeEventListener("storage", handler);
  };
}

export interface SavedLocation {
  /** Normalised query, also used as the identity for de-duplication. */
  id: string;
  /** What the user sees, e.g. "London". */
  label: string;
  /** What gets sent to the API — may be "51.5,-0.12" for a geolocation pin. */
  query: string;
}

export const MAX_SAVED_LOCATIONS = 12;
export const MAX_RECENT_SEARCHES = 5;

export const locationId = (query: string) => query.trim().toLowerCase();

export const isSaved = (saved: SavedLocation[], query: string) =>
  saved.some((entry) => entry.id === locationId(query));

export function addSavedLocation(saved: SavedLocation[], location: SavedLocation): SavedLocation[] {
  if (isSaved(saved, location.id)) return saved;
  return [...saved, location].slice(0, MAX_SAVED_LOCATIONS);
}

export const removeSavedLocation = (saved: SavedLocation[], id: string) =>
  saved.filter((entry) => entry.id !== id);

/** Move an entry to a new index, keeping the rest in order. */
export function reorderSavedLocations(saved: SavedLocation[], from: number, to: number): SavedLocation[] {
  if (from === to || from < 0 || to < 0 || from >= saved.length || to >= saved.length) return saved;
  const next = [...saved];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Most recent first, case-insensitively de-duplicated, capped. */
export function addRecentSearch(recent: string[], query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return recent;
  const withoutDuplicate = recent.filter((entry) => locationId(entry) !== locationId(trimmed));
  return [trimmed, ...withoutDuplicate].slice(0, MAX_RECENT_SEARCHES);
}

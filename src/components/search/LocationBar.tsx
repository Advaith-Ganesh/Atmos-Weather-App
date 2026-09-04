import { Clock, Star, X } from 'lucide-react';
import type { SavedLocation } from '../../lib/locations';

interface LocationBarProps {
  saved: SavedLocation[];
  recent: string[];
  activeQuery: string | null;
  onSelect: (query: string) => void;
  onRemoveSaved: (id: string) => void;
  onMoveSaved: (from: number, to: number) => void;
}

/**
 * Saved locations and recent searches share one strip: they are the same
 * action (jump to a place) and splitting them into two rows wastes vertical
 * space on mobile.
 */
export function LocationBar({
  saved,
  recent,
  activeQuery,
  onSelect,
  onRemoveSaved,
  onMoveSaved,
}: LocationBarProps) {
  const savedIds = new Set(saved.map((entry) => entry.id));
  const recentOnly = recent.filter((entry) => !savedIds.has(entry.trim().toLowerCase()));

  if (saved.length === 0 && recentOnly.length === 0) return null;

  return (
    <div className="edge-fade scrollbar-slim -mx-4 flex items-center gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {saved.length > 0 && (
        <ul className="flex shrink-0 items-center gap-1.5" aria-label="Saved locations">
          {saved.map((location, index) => {
            const active = activeQuery?.toLowerCase() === location.id;
            return (
              <li key={location.id} className="group relative">
                <div
                  className={`flex items-center rounded-full border pl-2.5 pr-1 text-xs transition-colors ${
                    active
                      ? 'border-accent/50 bg-accent/12 text-mist-100'
                      : 'border-white/8 bg-white/[0.03] text-mist-300 hover:border-white/16 hover:text-mist-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(location.query)}
                    className="flex items-center gap-1.5 py-1.5"
                    aria-current={active ? 'true' : undefined}
                  >
                    <Star className="h-3 w-3 fill-current text-warm" strokeWidth={0} aria-hidden />
                    {location.label}
                  </button>
                  <span className="ml-1 flex items-center">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => onMoveSaved(index, index - 1)}
                        aria-label={`Move ${location.label} earlier`}
                        className="rounded-full px-1 py-1 text-mist-400 opacity-0 transition-opacity hover:text-mist-100 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <span aria-hidden>&larr;</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveSaved(location.id)}
                      aria-label={`Remove ${location.label} from saved locations`}
                      className="rounded-full p-1 text-mist-400 transition-colors hover:text-mist-100"
                    >
                      <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {recentOnly.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
          <ul className="flex items-center gap-1.5" aria-label="Recent searches">
            {recentOnly.map((query) => (
              <li key={query}>
                <button
                  type="button"
                  onClick={() => onSelect(query)}
                  className="rounded-full px-2.5 py-1.5 text-xs text-mist-400 transition-colors hover:bg-white/[0.05] hover:text-mist-100"
                >
                  {query}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

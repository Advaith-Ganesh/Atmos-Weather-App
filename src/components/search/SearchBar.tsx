import { Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { validateQuery } from '../../lib/validation';

interface SearchBarProps {
  onSearch: (query: string) => void;
  /** Shown as the placeholder so the field reflects what is currently loaded. */
  currentLocation?: string;
  disabled?: boolean;
}

export function SearchBar({ onSearch, currentLocation, disabled }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  // "/" focuses search, matching the convention in most search-first products.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (event.key === '/' && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateQuery(value);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError(null);
    onSearch(result.value);
    inputRef.current?.blur();
  };

  return (
    <form onSubmit={submit} role="search" className="w-full">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          disabled={disabled}
          placeholder={currentLocation ? `Search — currently ${currentLocation}` : 'Search a city, postcode or country'}
          aria-label="Search for a location"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-white/8 bg-white/[0.04] py-2 pl-9 pr-9 text-sm text-mist-100 placeholder:text-mist-400 transition-colors hover:border-white/14 focus:border-accent/60 focus:bg-white/[0.06] focus:outline-none disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('');
              setError(null);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-mist-400 transition-colors hover:text-mist-100"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 pl-1 text-xs text-warm">
          {error}
        </p>
      )}
    </form>
  );
}

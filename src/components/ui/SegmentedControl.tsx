interface Option<T extends string> {
  value: T;
  label: string;
  /** Announced instead of `label` when the visible text is an abbreviation. */
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<Option<T>>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
}: SegmentedControlProps<T>) {
  const padding = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';

  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-white/8 bg-white/[0.03] p-0.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            aria-label={option.ariaLabel}
            className={`${padding} rounded-md font-medium transition-colors ${
              selected ? 'bg-white/12 text-mist-100' : 'text-mist-400 hover:text-mist-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

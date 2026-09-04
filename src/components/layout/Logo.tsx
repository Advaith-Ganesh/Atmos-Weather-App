/**
 * Wordmark: three isobar-style arcs beside the name. Drawn inline so it inherits
 * `currentColor` and stays crisp at any size.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 28 28" className="h-6 w-6 text-accent" fill="none" aria-hidden focusable="false">
        <path
          d="M4.5 9.2c3.6-3.4 9.6-4.2 14.6-1.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path d="M2.6 14.4c4.8-4.6 13.8-5.6 20.4-1.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path
          d="M5.4 19.6c3.6-2.8 9.2-3.4 13.4-1.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx="23" cy="13.2" r="2" fill="currentColor" />
      </svg>
      <span className="text-[15px] font-semibold tracking-[0.28em] text-mist-100">ATMOS</span>
    </div>
  );
}

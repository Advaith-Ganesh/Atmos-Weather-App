import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Rendered as a labelled region so screen readers can jump between sections. */
  labelledBy?: string;
}

export function Panel({ title, action, children, className = '', labelledBy }: PanelProps) {
  const headingId = labelledBy ?? (title ? `panel-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <section className={`panel p-4 sm:p-5 ${className}`} aria-labelledby={headingId}>
      {title && (
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <h2 id={headingId} className="text-[11px] font-medium uppercase tracking-[0.14em] text-mist-400">
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

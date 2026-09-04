import { Skeleton } from './Skeleton';

/** Mirrors the real dashboard grid so nothing shifts when the data lands. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading weather data</span>

      <section className="panel p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div className="w-full max-w-xs">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3.5 w-28" />
            <Skeleton className="mt-1.5 h-3 w-36" />
            <Skeleton className="mt-6 h-16 w-48" />
          </div>
          <div className="flex items-center gap-6 sm:flex-col sm:items-end">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <Skeleton className="h-3 w-44" />
        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="flex w-14 shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-7" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 sm:p-5 lg:col-span-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-56 w-full" />
        </section>
        <section className="panel p-4 sm:p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-4 h-8 w-28" />
          <Skeleton className="mt-6 h-1 w-full" />
          <div className="mt-5 flex justify-between">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-14" />
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 sm:p-5 lg:col-span-2">
          <Skeleton className="h-3 w-24" />
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-5 w-12" />
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-4 sm:p-5">
          <Skeleton className="h-3 w-32" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-2 w-full" />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 sm:p-5 lg:col-span-2">
          <Skeleton className="h-3 w-28" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        </section>
        <div className="space-y-4">
          <section className="panel p-4 sm:p-5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="mt-4 h-5 w-32" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-4/5" />
          </section>
          <section className="panel p-4 sm:p-5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-4 h-5 w-24" />
            <Skeleton className="mt-4 h-3 w-full" />
          </section>
        </div>
      </div>
    </div>
  );
}

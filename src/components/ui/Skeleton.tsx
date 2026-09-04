interface SkeletonProps {
  className?: string;
}

/**
 * Placeholder block matching the footprint of the real content, so the layout
 * doesn't jump when data arrives.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-white/[0.07] ${className}`} aria-hidden />;
}

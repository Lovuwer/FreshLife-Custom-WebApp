import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-md) 0' }}>
      {/* Banner skeleton */}
      <Skeleton variant="rect" height={160} borderRadius="var(--radius-lg)" />

      {/* Category row skeleton */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', overflow: 'hidden' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Skeleton variant="circle" width={56} height={56} />
            <Skeleton variant="text" width={48} height={12} />
          </div>
        ))}
      </div>

      {/* Section title skeleton */}
      <Skeleton variant="text" width="40%" height={20} borderRadius="var(--radius-sm)" />

      {/* Product grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <Skeleton variant="rect" height={160} borderRadius="var(--radius-md)" />
            <Skeleton variant="text" width="80%" height={14} />
            <Skeleton variant="text" width="40%" height={14} />
          </div>
        ))}
      </div>

      {/* Section title skeleton */}
      <Skeleton variant="text" width="35%" height={20} borderRadius="var(--radius-sm)" />

      {/* Featured section skeleton (horizontal scroll) */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', overflow: 'hidden' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ flexShrink: 0, width: 160 }}>
            <Skeleton variant="rect" height={200} borderRadius="var(--radius-md)" />
          </div>
        ))}
      </div>
    </div>
  );
}

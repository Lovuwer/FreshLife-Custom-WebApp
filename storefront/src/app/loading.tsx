import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-md) 0' }}>
      <Skeleton variant="rect" height={160} borderRadius="var(--radius-lg)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
        {[1,2,3,4].map((i) => (
          <Skeleton key={i} variant="rect" height={200} borderRadius="var(--radius-md)" />
        ))}
      </div>
    </div>
  );
}

'use client';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <EmptyState
        icon={<span style={{ fontSize: '3rem' }}>⚠️</span>}
        title="Something went wrong"
        description="An unexpected error occurred. Please try again."
        action={<Button variant="primary" onClick={reset}>Try Again</Button>}
      />
    </div>
  );
}

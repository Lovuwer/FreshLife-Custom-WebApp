import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <EmptyState
        icon={<span style={{ fontSize: '3rem' }}>🔍</span>}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        action={<Link href="/"><Button variant="primary">Go Home</Button></Link>}
      />
    </div>
  );
}

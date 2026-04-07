'use client';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RefundCard } from '@/components/account/RefundCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRefunds } from '@/lib/hooks/useRefunds';
import styles from './page.module.css';

export default function RefundsPage() {
  const { data: refunds, isLoading } = useRefunds();

  return (
    <AuthGuard>
      <div className={styles.page}>
        <div className={styles.header}>
          <Link href="/account" className={styles.back}>← Back</Link>
          <h1 className={styles.title}>💰 Refunds</h1>
        </div>

        {isLoading && (
          <div className={styles.skeletons}>
            {[1, 2].map((i) => (
              <Skeleton key={i} variant="rect" height={120} borderRadius="var(--radius-lg)" />
            ))}
          </div>
        )}

        {!isLoading && (!refunds || refunds.length === 0) && (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>💰</span>}
            title="No refunds"
            description="Any refund requests will appear here"
          />
        )}

        {refunds && refunds.length > 0 && (
          <div className={styles.list}>
            {refunds.map((refund) => (
              <RefundCard key={refund.name} refund={refund} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

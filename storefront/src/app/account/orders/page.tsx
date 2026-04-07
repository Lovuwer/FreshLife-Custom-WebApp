'use client';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { OrderCard } from '@/components/account/OrderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useOrders, useReorder } from '@/lib/hooks/useOrders';
import styles from './page.module.css';

export default function OrdersPage() {
  const { data, isLoading } = useOrders();
  const reorder = useReorder();

  return (
    <AuthGuard>
      <div className={styles.page}>
        <div className={styles.header}>
          <Link href="/account" className={styles.back}>← Back</Link>
          <h1 className={styles.title}>📦 Past Orders</h1>
        </div>

        {isLoading && (
          <div className={styles.skeletons}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rect" height={160} borderRadius="var(--radius-lg)" />
            ))}
          </div>
        )}

        {!isLoading && (!data || data.orders.length === 0) && (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>📦</span>}
            title="No orders yet"
            description="Your order history will appear here"
            action={<Link href="/"><Button variant="primary">Start Shopping</Button></Link>}
          />
        )}

        {data && data.orders.length > 0 && (
          <div className={styles.list}>
            {data.orders.map((order) => (
              <OrderCard
                key={order.name}
                order={order}
                onReorder={() => reorder.mutate(order.name)}
                isReordering={reorder.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

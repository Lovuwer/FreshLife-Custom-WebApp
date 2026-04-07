'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCategoryItems } from '@/lib/hooks/useProducts';
import { useLocationStore } from '@/lib/stores/locationStore';
import { ProductGrid } from '@/components/home/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug);
  const { currentLocation } = useLocationStore();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useCategoryItems(slug, {
    warehouse: currentLocation?.warehouse ?? undefined,
    page,
    pageSize: 20,
  });

  const title = slug === 'all' ? 'All Products' : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/" className={styles.back}>← Back</Link>
        <h1 className={styles.title}>{title}</h1>
      </div>

      {isLoading && (
        <div className={styles.grid}>
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} variant="rect" height={200} borderRadius="var(--radius-md)" />)}
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={<span style={{ fontSize: '3rem' }}>🛒</span>}
          title="No products found"
          description="We couldn't find any products in this category."
          action={<Link href="/"><Button variant="primary">Go Home</Button></Link>}
        />
      )}

      {!isLoading && data && data.items.length > 0 && (
        <>
          <ProductGrid products={data.items} />
          {data.has_more && (
            <div className={styles.loadMore}>
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

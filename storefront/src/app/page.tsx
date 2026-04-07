'use client';
import { useHomepageData } from '@/lib/hooks/useProducts';
import { useLocationStore } from '@/lib/stores/locationStore';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { CategoryRow } from '@/components/home/CategoryRow';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { ProductGrid } from '@/components/home/ProductGrid';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function HomePage() {
  const { currentLocation } = useLocationStore();
  const { data, isLoading, refetch } = useHomepageData(currentLocation?.warehouse ?? undefined);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Skeleton variant="rect" height={160} borderRadius="var(--radius-lg)" />
        <div className={styles.categorySkeletons}>
          {[1,2,3,4,5].map((i) => <Skeleton key={i} variant="circle" width={64} height={64} />)}
        </div>
        <div className={styles.gridSkeletons}>
          {[1,2,3,4].map((i) => <Skeleton key={i} variant="rect" height={200} borderRadius="var(--radius-md)" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <div className={styles.page}>
        {data.banners.length > 0 && <BannerCarousel banners={data.banners} />}
        {data.categories.length > 0 && <CategoryRow categories={data.categories} />}
        {data.featured_items.length > 0 && (
          <FeaturedSection items={data.featured_items} title="Picked for You" />
        )}
        {data.trending_items.length > 0 && (
          <ProductGrid products={data.trending_items} title="Trending Now" />
        )}
        {data.fresh_arrivals.length > 0 && (
          <FeaturedSection items={data.fresh_arrivals} title="Fresh Arrivals" />
        )}
      </div>
    </PullToRefresh>
  );
}

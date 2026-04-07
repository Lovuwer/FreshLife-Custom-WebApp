import type { Product } from '@/lib/types/product';
import { ProductCard } from '@/components/product/ProductCard';
import styles from './FeaturedSection.module.css';

interface FeaturedSectionProps {
  items: Product[];
  title: string;
}

export function FeaturedSection({ items, title }: FeaturedSectionProps) {
  if (!items.length) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.scrollContainer}>
        {items.map((product) => (
          <div key={product.item_code} className={styles.cardWrap}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

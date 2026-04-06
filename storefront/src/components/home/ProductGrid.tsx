import type { Product } from '@/lib/types/product';
import { ProductCard } from '@/components/product/ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export function ProductGrid({ products, title }: ProductGridProps) {
  if (!products.length) return null;

  return (
    <section className={styles.section}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.item_code} product={product} />
        ))}
      </div>
    </section>
  );
}

import type { Product } from '@/lib/types/product';
import { ProductCard } from './ProductCard';
import styles from './RelatedProducts.module.css';

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products.length) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Similar Products</h2>
      <div className={styles.scroll}>
        {products.map((p) => (
          <div key={p.item_code} className={styles.cardWrap}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

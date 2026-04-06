'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/types/product';
import styles from './CategoryRow.module.css';

interface CategoryRowProps {
  categories: Category[];
}

export function CategoryRow({ categories }: CategoryRowProps) {
  if (!categories.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.scrollContainer}>
        {categories.map((cat) => (
          <Link key={cat.name} href={`/category/${encodeURIComponent(cat.name)}`} className={styles.item}>
            <div className={styles.iconWrap}>
              {cat.image ? (
                <Image src={cat.image} alt={cat.label} width={56} height={56} className={styles.icon} />
              ) : (
                <div className={styles.iconPlaceholder}>🛒</div>
              )}
            </div>
            <span className={styles.label}>{cat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

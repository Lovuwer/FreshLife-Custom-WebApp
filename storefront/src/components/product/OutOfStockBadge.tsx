'use client';
import styles from './OutOfStockBadge.module.css';

interface OutOfStockBadgeProps {
  className?: string;
}

export function OutOfStockBadge({ className }: OutOfStockBadgeProps) {
  return (
    <span className={`${styles.badge} ${className ?? ''}`} aria-label="Out of stock">
      Out of Stock
    </span>
  );
}

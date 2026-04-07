import type { BillSummary } from '@/lib/types/cart';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import styles from './BillBreakdown.module.css';

interface BillBreakdownProps {
  bill: BillSummary | null;
  isLoading: boolean;
}

export function BillBreakdown({ bill, isLoading }: BillBreakdownProps) {
  if (isLoading) {
    return (
      <div className={styles.section}>
        <Skeleton variant="text" height={20} />
        <Skeleton variant="text" height={20} />
        <Skeleton variant="text" height={20} />
        <Skeleton variant="text" height={24} />
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className={styles.section}>
      <h3 className={styles.heading}>Bill Details</h3>
      {bill.breakdown.map((line) => (
        <div key={line.label} className={styles.row}>
          <span className={styles.label}>{line.label}</span>
          <span className={styles.value}>{formatCurrency(line.amount)}</span>
        </div>
      ))}
      {bill.discount_amount > 0 && (
        <div className={styles.row}>
          <span className={styles.label}>Discount</span>
          <span className={`${styles.value} ${styles.discount}`}>−{formatCurrency(bill.discount_amount)}</span>
        </div>
      )}
      <div className={`${styles.row} ${styles.total}`}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalValue}>{formatCurrency(bill.grand_total)}</span>
      </div>
      {bill.savings > 0 && (
        <p className={styles.savings}>You save {formatCurrency(bill.savings)} 🎉</p>
      )}
      {!bill.min_order_met && (
        <p className={styles.minOrder}>
          Add {formatCurrency(bill.min_order_value - bill.subtotal)} more to place order
        </p>
      )}
    </div>
  );
}

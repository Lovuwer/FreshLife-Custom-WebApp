import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import styles from './PriceBlock.module.css';

interface PriceBlockProps {
  rate: number;
  mrp?: number;
  discount?: number;
}

export function PriceBlock({ rate, mrp, discount }: PriceBlockProps) {
  const showMRP = mrp && mrp > rate;
  const discountPct = discount ?? (showMRP ? Math.round(((mrp - rate) / mrp) * 100) : 0);

  return (
    <div className={styles.priceBlock}>
      <span className={styles.price}>{formatCurrency(rate)}</span>
      {showMRP && <span className={styles.mrp}>{formatCurrency(mrp)}</span>}
      {discountPct > 0 && (
        <Badge text={`${discountPct}% off`} variant="success" />
      )}
    </div>
  );
}

'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import type { MagicListResult } from '@/lib/types/magicList';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import styles from './AddAllToCart.module.css';

interface AddAllToCartProps {
  result: MagicListResult;
  onAddAll: () => void;
}

export function AddAllToCart({ result, onAddAll }: AddAllToCartProps) {
  const matchedItems = result.extracted_items.filter(
    (i) => i.match_status === 'Matched' && i.matched_item?.in_stock
  );

  if (!matchedItems.length) return null;

  const estimatedTotal = matchedItems.reduce((sum, item) => {
    if (!item.matched_item) return sum;
    const qty = parseInt(item.quantity || '1', 10) || 1;
    return sum + item.matched_item.rate * qty;
  }, 0);

  return (
    <motion.div
      className={styles.bar}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className={styles.info}>
        <span className={styles.count}>
          {matchedItems.length} of {result.summary.total} items ready
        </span>
        <span className={styles.total}>Est. {formatCurrency(estimatedTotal)}</span>
      </div>
      <Button variant="primary" size="lg" fullWidth onClick={onAddAll}>
        🛒 Add All to Cart
      </Button>
    </motion.div>
  );
}

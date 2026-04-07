'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { MagicListItem } from '@/lib/types/magic-list';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import styles from './MatchedItemsList.module.css';

interface MatchedItemsListProps {
  items: MagicListItem[];
  onAddItem: (item: MagicListItem) => void;
}

export function MatchedItemsList({ items, onAddItem }: MatchedItemsListProps) {
  const matched = items.filter((i) => i.match_status === 'Matched');

  if (!matched.length) return null;

  return (
    <div className={styles.section}>
      <h3 className={styles.heading}>
        ✅ Matched Items ({matched.length})
      </h3>
      <div className={styles.list}>
        {matched.map((item, idx) => (
          <motion.div
            key={`${item.extracted_name}-${idx}`}
            className={styles.item}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className={styles.matchInfo}>
              <span className={styles.extracted}>
                {item.extracted_name}
                {item.quantity && ` × ${item.quantity}${item.unit || ''}`}
              </span>
              <span className={styles.arrow}>→</span>
            </div>
            {item.matched_item && (
              <div className={styles.product}>
                <div className={styles.productImage}>
                  {item.matched_item.image ? (
                    <Image src={item.matched_item.image} alt={item.matched_item.item_name} fill sizes="40px" className={styles.img} />
                  ) : (
                    <span className={styles.placeholder}>🛒</span>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{item.matched_item.item_name}</span>
                  <span className={styles.productPrice}>{formatCurrency(item.matched_item.rate)}</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAddItem(item)}
                  disabled={!item.matched_item.in_stock}
                >
                  {item.matched_item.in_stock ? '+' : '✗'}
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

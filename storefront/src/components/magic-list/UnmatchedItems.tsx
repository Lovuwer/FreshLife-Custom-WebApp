'use client';
import { motion } from 'framer-motion';
import type { MagicListItem } from '@/lib/types/magicList';
import styles from './UnmatchedItems.module.css';

interface UnmatchedItemsProps {
  items: MagicListItem[];
}

export function UnmatchedItems({ items }: UnmatchedItemsProps) {
  const unmatched = items.filter((i) => i.match_status === 'Unmatched');
  const partial = items.filter((i) => i.match_status === 'Partial');

  if (!unmatched.length && !partial.length) return null;

  return (
    <div className={styles.section}>
      {partial.length > 0 && (
        <>
          <h3 className={styles.heading}>⚠️ Partial Matches ({partial.length})</h3>
          <div className={styles.list}>
            {partial.map((item, idx) => (
              <motion.div
                key={`partial-${idx}`}
                className={styles.item}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <span className={styles.name}>{item.extracted_name}</span>
                {item.alternatives.length > 0 && (
                  <span className={styles.alt}>
                    Try: {item.alternatives.map((a) => a.item_name).join(', ')}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {unmatched.length > 0 && (
        <>
          <h3 className={styles.headingError}>❌ Not Found ({unmatched.length})</h3>
          <div className={styles.list}>
            {unmatched.map((item, idx) => (
              <motion.div
                key={`unmatched-${idx}`}
                className={styles.itemUnmatched}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <span className={styles.name}>{item.extracted_name}</span>
                <span className={styles.notFound}>Not in catalog</span>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

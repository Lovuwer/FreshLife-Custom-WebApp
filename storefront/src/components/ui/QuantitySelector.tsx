'use client';

import { AnimatePresence, motion } from 'framer-motion';
import styles from './QuantitySelector.module.css';

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  max?: number;
  compact?: boolean;
}

export function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  max = 99,
  compact = false,
}: QuantitySelectorProps) {
  const wrapper = compact ? styles.compact : undefined;

  if (quantity === 0) {
    return (
      <div className={wrapper}>
        <button
          type="button"
          className={styles.addButton}
          onClick={onIncrement}
          aria-label="Add to cart"
        >
          Add
        </button>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <div className={styles.pill}>
        <button
          type="button"
          className={styles.stepButton}
          onClick={onDecrement}
          aria-label="Decrease quantity"
        >
          −
        </button>

        <span className={styles.count}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={quantity}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {quantity}
            </motion.span>
          </AnimatePresence>
        </span>

        <button
          type="button"
          className={styles.stepButton}
          onClick={onIncrement}
          disabled={quantity >= max}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}

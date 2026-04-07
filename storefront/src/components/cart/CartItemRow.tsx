'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { CartItem } from '@/lib/types/cart';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useCartStore } from '@/lib/stores/cartStore';
import styles from './CartItemRow.module.css';

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <motion.div
      className={styles.row}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <div className={styles.imageWrap}>
        {item.image ? (
          <Image src={item.image} alt={item.item_name} fill className={styles.image} sizes="56px" />
        ) : (
          <div className={styles.imagePlaceholder}>🛒</div>
        )}
      </div>
      <div className={styles.details}>
        <p className={styles.name}>{item.item_name}</p>
        <p className={styles.price}>{formatCurrency(item.rate)}</p>
      </div>
      <div className={styles.controls}>
        <QuantitySelector
          quantity={item.quantity}
          onIncrement={() => updateQuantity(item.item_code, item.quantity + 1)}
          onDecrement={() => {
            if (item.quantity <= 1) removeItem(item.item_code);
            else updateQuantity(item.item_code, item.quantity - 1);
          }}
          max={item.max_qty}
          compact
        />
        <p className={styles.total}>{formatCurrency(item.rate * item.quantity)}</p>
      </div>
    </motion.div>
  );
}

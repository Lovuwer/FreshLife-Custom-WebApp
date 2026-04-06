'use client';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/stores/cartStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import styles from './FloatingCart.module.css';

export function FloatingCart() {
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCartStore((s) => s.getItemCount());
  const grandTotal = useCartStore((s) => s.getGrandTotal());

  const isVisible = itemCount > 0 && pathname !== '/cart';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={styles.bar}
          onClick={() => router.push('/cart')}
        >
          <span className={styles.count}>🛒 {itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          <span className={styles.total}>{formatCurrency(grandTotal)}</span>
          <span className={styles.cta}>View Cart →</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

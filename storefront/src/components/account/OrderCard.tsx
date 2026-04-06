'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Order } from '@/lib/types/order';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import styles from './OrderCard.module.css';

interface OrderCardProps {
  order: Order;
  onReorder: () => void;
  isReordering?: boolean;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  Completed: 'success',
  Submitted: 'info',
  Cancelled: 'error',
  Draft: 'warning',
};

export function OrderCard({ order, onReorder, isReordering }: OrderCardProps) {
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.header}>
        <div>
          <p className={styles.orderId}>Order #{order.name}</p>
          <p className={styles.date}>{formatDate(order.creation)}</p>
        </div>
        <Badge text={order.status} variant={STATUS_VARIANT[order.status] || 'info'} />
      </div>

      <div className={styles.items}>
        {order.items.slice(0, 3).map((item) => (
          <div key={item.item_code} className={styles.item}>
            <div className={styles.itemImage}>
              {item.image ? (
                <Image src={item.image} alt={item.item_name} fill sizes="36px" className={styles.img} />
              ) : (
                <span className={styles.itemPlaceholder}>🛒</span>
              )}
            </div>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{item.item_name}</span>
              <span className={styles.itemQty}>× {item.quantity}</span>
            </div>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className={styles.moreItems}>+{order.items.length - 3} more items</p>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.total}>{formatCurrency(order.grand_total)}</span>
        <Button variant="secondary" size="sm" onClick={onReorder} loading={isReordering}>
          🔄 Reorder
        </Button>
      </div>
    </motion.div>
  );
}

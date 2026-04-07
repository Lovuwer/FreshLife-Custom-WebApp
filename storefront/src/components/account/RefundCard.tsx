'use client';
import { motion } from 'framer-motion';
import type { Refund } from '@/lib/types/account';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { Badge } from '@/components/ui/Badge';
import styles from './RefundCard.module.css';

interface RefundCardProps {
  refund: Refund;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  Completed: 'success',
  Processing: 'warning',
  Initiated: 'info',
  Failed: 'error',
};

export function RefundCard({ refund }: RefundCardProps) {
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.header}>
        <div>
          <p className={styles.orderId}>Order #{refund.sales_order}</p>
          <p className={styles.date}>{formatDate(refund.initiated_at)}</p>
        </div>
        <Badge text={refund.status} variant={STATUS_VARIANT[refund.status] || 'info'} />
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.detailLabel}>Amount</span>
          <span className={styles.detailValue}>{formatCurrency(refund.refund_amount)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.detailLabel}>Type</span>
          <span className={styles.detailValue}>{refund.refund_type} Refund</span>
        </div>
        <div className={styles.row}>
          <span className={styles.detailLabel}>Reason</span>
          <span className={styles.detailValue}>{refund.reason}</span>
        </div>
        {refund.completed_at && (
          <div className={styles.row}>
            <span className={styles.detailLabel}>Completed</span>
            <span className={styles.detailValue}>{formatDate(refund.completed_at)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

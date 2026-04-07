'use client';
import { motion } from 'framer-motion';
import type { Address } from '@/lib/types/account';
import { Button } from '@/components/ui/Button';
import styles from './AddressCard.module.css';

interface AddressCardProps {
  address: Address;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AddressCard({ address, isSelected, onSelect, onEdit, onDelete }: AddressCardProps) {
  return (
    <motion.div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className={styles.header}>
        <span className={styles.label}>
          {address.address_label === 'Home' ? '🏠' : address.address_label === 'Work' ? '🏢' : '📍'}{' '}
          {address.address_label}
        </span>
        {address.is_primary_address && <span className={styles.primary}>Primary</span>}
      </div>

      <p className={styles.title}>{address.address_title}</p>
      <p className={styles.line}>{address.address_line1}</p>
      {address.address_line2 && <p className={styles.line}>{address.address_line2}</p>}
      <p className={styles.line}>{address.city}, {address.state} — {address.pincode}</p>

      {address.delivery_instructions && (
        <p className={styles.instructions}>📝 {address.delivery_instructions}</p>
      )}

      {(onEdit || onDelete) && (
        <div className={styles.actions}>
          {onEdit && <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>Edit</Button>}
          {onDelete && (
            <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              Delete
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

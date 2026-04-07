'use client';
import type { Address } from '@/lib/types/account';
import styles from './DeliveryAddress.module.css';

interface DeliveryAddressProps {
  address: Address | null;
  onChange: () => void;
}

export function DeliveryAddress({ address, onChange }: DeliveryAddressProps) {
  if (!address) {
    return (
      <button className={styles.addAddress} onClick={onChange}>
        + Add Delivery Address
      </button>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span className={styles.label}>📍 {address.address_label}</span>
        <button className={styles.changeBtn} onClick={onChange}>Change</button>
      </div>
      <p className={styles.address}>
        {address.address_line1}
        {address.address_line2 ? `, ${address.address_line2}` : ''}
        {', '}{address.city} — {address.pincode}
      </p>
    </div>
  );
}

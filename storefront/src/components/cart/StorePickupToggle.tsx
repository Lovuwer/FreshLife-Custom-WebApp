'use client';
import type { StorePickup } from '@/lib/types/delivery';
import styles from './StorePickupToggle.module.css';

interface StorePickupToggleProps {
  isPickup: boolean;
  onToggle: (value: boolean) => void;
  pickupInfo: StorePickup | null;
}

export function StorePickupToggle({ isPickup, onToggle, pickupInfo }: StorePickupToggleProps) {
  return (
    <div className={styles.section}>
      <div className={styles.toggle}>
        <button
          className={`${styles.btn} ${!isPickup ? styles.btnActive : ''}`}
          onClick={() => onToggle(false)}
        >
          🚚 Delivery
        </button>
        <button
          className={`${styles.btn} ${isPickup ? styles.btnActive : ''}`}
          onClick={() => onToggle(true)}
        >
          🏪 Store Pickup
        </button>
      </div>
      {isPickup && pickupInfo && (
        <div className={styles.info}>
          <p className={styles.storeName}>{pickupInfo.warehouse_name}</p>
          <p className={styles.storeAddress}>{pickupInfo.address}</p>
          <p className={styles.storeHours}>⏰ {pickupInfo.pickup_hours}</p>
          <p className={styles.readyTime}>Ready in ~{pickupInfo.estimated_ready_minutes} min</p>
        </div>
      )}
    </div>
  );
}

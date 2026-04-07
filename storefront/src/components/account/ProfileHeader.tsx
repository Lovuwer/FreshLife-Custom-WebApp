'use client';
import styles from './ProfileHeader.module.css';
import { useAuthStore } from '@/lib/stores/authStore';

export function ProfileHeader() {
  const customer = useAuthStore(s => s.customer);

  return (
    <div className={styles.wrapper}>
      <div className={styles.avatar} aria-hidden="true">
        {customer?.customer_name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{customer?.customer_name ?? 'Guest'}</p>
        <p className={styles.phone}>{customer?.phone ?? ''}</p>
      </div>
    </div>
  );
}

'use client';
import { useLocationStore } from '@/lib/stores/locationStore';
import { SearchBar } from './SearchBar';
import styles from './Header.module.css';

export function Header() {
  const { currentLocation } = useLocationStore();
  const locationLabel = currentLocation
    ? `${currentLocation.address_title || currentLocation.city}`
    : 'Select Location';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button className={styles.location} aria-label="Change location">
          <span className={styles.locationIcon}>📍</span>
          <div className={styles.locationText}>
            <span className={styles.locationHelper}>Deliver to</span>
            <span className={styles.locationLabel}>{locationLabel}</span>
          </div>
        </button>
        <div className={styles.searchWrap}>
          <SearchBar />
        </div>
      </div>
    </header>
  );
}

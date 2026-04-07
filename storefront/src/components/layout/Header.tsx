'use client';
import Link from 'next/link';
import { useLocationStore } from '@/lib/stores/locationStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { SearchBar } from './SearchBar';
import styles from './Header.module.css';

const DESKTOP_NAV = [
  { href: '/', label: 'Home' },
  { href: '/category/all', label: 'Categories' },
  { href: '/magic-list', label: '✨ Magic List' },
  { href: '/account', label: 'Account' },
];

export function Header() {
  const { currentLocation } = useLocationStore();
  const itemCount = useCartStore((s) => s.getItemCount());
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
        <nav className={styles.desktopNav}>
          {DESKTOP_NAV.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.desktopNavLink}>
              {label}
            </Link>
          ))}
          <Link href="/cart" className={styles.desktopCartLink}>
            🛒{itemCount > 0 && <span className={styles.desktopBadge}>{itemCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/category/all', label: 'Categories', icon: '📋' },
  { href: '/magic-list', label: 'Magic', icon: '✨' },
  { href: '/cart', label: 'Cart', icon: '🛒' },
  { href: '/account', label: 'Account', icon: '👤' },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const isCart = href === '/cart';
          return (
            <Link key={href} href={href} className={`${styles.item} ${isActive ? styles.itemActive : ''}`}>
              <span className={styles.icon}>
                {icon}
                {isCart && itemCount > 0 && (
                  <span className={styles.badge}>{itemCount > 9 ? '9+' : itemCount}</span>
                )}
              </span>
              <span className={styles.label}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

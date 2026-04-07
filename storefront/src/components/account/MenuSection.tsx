'use client';
import Link from 'next/link';
import styles from './MenuSection.module.css';

interface MenuItem {
  href: string;
  icon: string;
  label: string;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  { href: '/account/orders',     icon: '📦', label: 'My Orders',     description: 'Track and reorder' },
  { href: '/account/addresses',  icon: '📍', label: 'Addresses',     description: 'Manage delivery locations' },
  { href: '/account/membership', icon: '⭐', label: 'Membership',    description: 'Free delivery & discounts' },
  { href: '/account/refunds',    icon: '↩️', label: 'Refunds',       description: 'Track refund status' },
  { href: '/account/support',    icon: '💬', label: 'Support',       description: 'Get help with orders' },
];

interface MenuSectionProps {
  title?: string;
  items?: MenuItem[];
}

export function MenuSection({ title = 'Account', items = MENU_ITEMS }: MenuSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <ul className={styles.list} role="list">
        {items.map(item => (
          <li key={item.href}>
            <Link href={item.href} className={styles.item}>
              <span className={styles.icon} aria-hidden="true">{item.icon}</span>
              <span className={styles.text}>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.description}>{item.description}</span>
              </span>
              <span className={styles.chevron} aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

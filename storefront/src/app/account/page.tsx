'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import styles from './page.module.css';

const MENU_ITEMS = [
  { href: '/account/orders', icon: '📦', label: 'Past Orders' },
  { href: '/account/addresses', icon: '📍', label: 'Manage Addresses' },
  { href: '/account/refunds', icon: '💰', label: 'Refunds' },
  { href: '/account/support', icon: '💬', label: 'Customer Support' },
  { href: '/account/membership', icon: '⭐', label: 'Membership' },
];

export default function AccountPage() {
  const { customer, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className={styles.page}>
        {customer && (
          <div className={styles.profileCard}>
            <div className={styles.avatar}>{customer.customer_name.charAt(0).toUpperCase()}</div>
            <div>
              <p className={styles.name}>{customer.customer_name}</p>
              <p className={styles.phone}>+91 {customer.phone}</p>
            </div>
          </div>
        )}

        <div className={styles.menu}>
          {MENU_ITEMS.map(({ href, icon, label }) => (
            <Link key={href} href={href} className={styles.menuItem}>
              <span className={styles.menuIcon}>{icon}</span>
              <span className={styles.menuLabel}>{label}</span>
              <span className={styles.menuArrow}>›</span>
            </Link>
          ))}
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </div>
    </AuthGuard>
  );
}

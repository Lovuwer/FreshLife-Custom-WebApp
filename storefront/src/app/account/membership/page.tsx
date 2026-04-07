import type { Metadata } from 'next';
import styles from './page.module.css';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Membership — FreshLife',
  description: 'View your FreshLife membership plan and benefits',
};

export default function MembershipPage() {
  return (
    <AuthGuard>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Membership</h1>
        </header>

        <section className={styles.currentPlan}>
          <p className={styles.planLabel}>Your current plan</p>
          <h2 className={styles.planName}>Free</h2>
        </section>

        <section className={styles.plans}>
          <div className={styles.planCard}>
            <div className={styles.planBadge}>FreshLife Plus</div>
            <ul className={styles.benefits}>
              <li>Free delivery on orders above ₹500</li>
              <li>5% cashback on every order</li>
              <li>Priority customer support</li>
              <li>Early access to new products</li>
            </ul>
            <button className="btn-primary" style={{ width: '100%' }}>
              Upgrade — ₹199/month
            </button>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}

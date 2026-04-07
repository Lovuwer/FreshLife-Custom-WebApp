'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import styles from './page.module.css';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.icon}>✅</div>
      <h1 className={styles.title}>Order Confirmed!</h1>
      <p className={styles.subtitle}>
        Your order {orderId ? `#${orderId}` : ''} has been placed successfully.
      </p>

      <div className={styles.infoCard}>
        <p className={styles.infoText}>
          📦 You'll receive updates on your delivery status.
        </p>
        <p className={styles.infoText}>
          💳 Payment has been confirmed via Razorpay.
        </p>
      </div>

      <div className={styles.actions}>
        <Link href="/account/orders">
          <Button variant="secondary" fullWidth>View My Orders</Button>
        </Link>
        <Link href="/">
          <Button variant="primary" fullWidth>Continue Shopping</Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function CheckoutConfirmationPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className={styles.page}><p>Loading...</p></div>}>
        <ConfirmationContent />
      </Suspense>
    </AuthGuard>
  );
}

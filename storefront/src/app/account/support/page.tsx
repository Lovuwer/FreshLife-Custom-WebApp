'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SupportForm } from '@/components/account/SupportForm';
import { Toast } from '@/components/ui/Toast';
import { createSupportTicket } from '@/lib/api/account';
import styles from './page.module.css';

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: { subject: string; description: string; category: string }) => {
    setIsSubmitting(true);
    try {
      await createSupportTicket(data);
      setSuccess(true);
    } catch {
      // Error handled by form
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className={styles.page}>
        <div className={styles.header}>
          <Link href="/account" className={styles.back}>← Back</Link>
          <h1 className={styles.title}>💬 Customer Support</h1>
        </div>

        {success ? (
          <div className={styles.success}>
            <span className={styles.successIcon}>✅</span>
            <h2 className={styles.successTitle}>Ticket Submitted</h2>
            <p className={styles.successText}>Our team will respond within 24 hours.</p>
            <button className={styles.resetBtn} onClick={() => setSuccess(false)}>
              Submit Another
            </button>
          </div>
        ) : (
          <SupportForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        )}
      </div>
    </AuthGuard>
  );
}

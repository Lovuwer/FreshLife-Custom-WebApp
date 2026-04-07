'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/hooks/useCart';
import styles from './CouponInput.module.css';

export function CouponInput() {
  const { couponCode, applyCoupon, removeCoupon, items, couponError, couponResult } = useCart();
  const [input, setInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!input.trim()) return;
    setIsApplying(true);
    try {
      await applyCoupon(input.trim().toUpperCase());
    } finally {
      setIsApplying(false);
    }
  };

  if (couponCode) {
    return (
      <div className={styles.applied}>
        <div className={styles.appliedInfo}>
          <span className={styles.checkIcon}>✅</span>
          <div>
            <p className={styles.couponCode}>{couponCode}</p>
            <p className={styles.appliedText}>Coupon applied!</p>
          </div>
        </div>
        <button className={styles.removeBtn} onClick={removeCoupon}>Remove</button>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.inputRow}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className={styles.input}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          disabled={isApplying}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleApply}
          loading={isApplying}
          disabled={!input.trim() || items.length === 0}
        >
          Apply
        </Button>
      </div>
      {couponError && <p className={styles.error}>{couponError}</p>}
      {couponResult && !couponResult.valid && (
        <p className={styles.error}>{couponResult.message}</p>
      )}
    </div>
  );
}

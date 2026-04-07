'use client';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import styles from './PlaceOrderButton.module.css';

interface PlaceOrderButtonProps {
  total: number;
  disabled?: boolean;
  isLoading?: boolean;
  minOrderMet?: boolean;
  minOrderValue?: number;
  subtotal?: number;
  onClick: () => void;
}

export function PlaceOrderButton({
  total,
  disabled,
  isLoading,
  minOrderMet = true,
  minOrderValue = 500,
  subtotal = 0,
  onClick,
}: PlaceOrderButtonProps) {
  const isDisabled = disabled || !minOrderMet || isLoading;

  return (
    <div className={styles.wrapper}>
      {!minOrderMet && (
        <p className={styles.minOrderWarning}>
          Add {formatCurrency(minOrderValue - subtotal)} more to place order (min {formatCurrency(minOrderValue)})
        </p>
      )}
      <button
        className={styles.btn}
        disabled={isDisabled}
        onClick={onClick}
      >
        {isLoading ? (
          <span className={styles.spinner} />
        ) : (
          <>
            <span>Place Order</span>
            <span className={styles.total}>• {formatCurrency(total)}</span>
          </>
        )}
      </button>
    </div>
  );
}

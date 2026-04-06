'use client';
import type { ProductVariant } from '@/lib/types/product';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import styles from './VariantSelector.module.css';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

export function VariantSelector({ variants, selectedCode, onSelect }: VariantSelectorProps) {
  if (!variants.length) return null;

  return (
    <div className={styles.row}>
      {variants.map((v) => (
        <button
          key={v.item_code}
          onClick={() => onSelect(v.item_code)}
          disabled={!v.in_stock}
          className={`${styles.chip} ${v.item_code === selectedCode ? styles.selected : ''} ${!v.in_stock ? styles.disabled : ''}`}
        >
          <span className={styles.unit}>{v.unit_label}</span>
          <span className={styles.price}>{formatCurrency(v.rate)}</span>
        </button>
      ))}
    </div>
  );
}

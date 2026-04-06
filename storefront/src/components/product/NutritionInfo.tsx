'use client';
import { useState } from 'react';
import type { NutritionalInfo } from '@/lib/types/product';
import styles from './NutritionInfo.module.css';

interface NutritionInfoProps {
  info: NutritionalInfo;
}

const FIELDS: { key: keyof NutritionalInfo; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
];

export function NutritionInfo({ info }: NutritionInfoProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.section}>
      <button className={styles.header} onClick={() => setOpen((o) => !o)}>
        <span>🥗 Nutritional Information</span>
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`}>›</span>
      </button>
      {open && (
        <div className={styles.grid}>
          {FIELDS.map(({ key, label, unit }) => (
            <div key={key} className={styles.cell}>
              <span className={styles.cellLabel}>{label}</span>
              <span className={styles.cellValue}>{info[key]}{unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

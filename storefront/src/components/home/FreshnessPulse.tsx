'use client';
import { motion } from 'framer-motion';
import styles from './FreshnessPulse.module.css';

interface FreshnessPulseProps {
  category: string;
}

const labelMap: Record<string, string> = {
  Produce: '🌿 Farm Fresh',
  Dairy: '🥛 Fresh Today',
  Bakery: '🍞 Just Baked',
};

export function FreshnessPulse({ category }: FreshnessPulseProps) {
  const label = labelMap[category];
  if (!label) return null;

  return (
    <motion.div
      className={styles.chip}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
    >
      <span className={styles.pulse} />
      <span className={styles.label}>{label}</span>
    </motion.div>
  );
}

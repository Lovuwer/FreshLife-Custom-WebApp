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
    <div className={styles.chip}>
      <span className={styles.pulse} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

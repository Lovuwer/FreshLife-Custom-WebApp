import styles from './Skeleton.module.css';

type SkeletonVariant = 'text' | 'rect' | 'circle';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  variant?: SkeletonVariant;
}

export function Skeleton({
  width,
  height,
  borderRadius,
  className,
  variant = 'rect',
}: SkeletonProps) {
  const classes = [styles.skeleton, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{
        width,
        height,
        ...(borderRadius != null ? { borderRadius } : {}),
      }}
      aria-hidden="true"
    />
  );
}

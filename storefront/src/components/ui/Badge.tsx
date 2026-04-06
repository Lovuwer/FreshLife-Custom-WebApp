import styles from './Badge.module.css';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'custom';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  color?: string;
  className?: string;
}

export function Badge({
  text,
  variant = 'info',
  color,
  className,
}: BadgeProps) {
  const classes = [styles.badge, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  const inlineStyle =
    variant === 'custom' && color
      ? { color, background: `${color}1a` }
      : undefined;

  return (
    <span className={classes} style={inlineStyle}>
      {text}
    </span>
  );
}

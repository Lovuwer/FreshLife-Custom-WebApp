import type { Metadata } from 'next';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'FreshLife — Sign In',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.authLayout}>
      {children}
    </div>
  );
}

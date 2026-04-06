'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait a tick for hydration, then redirect if not authenticated
    const timer = setTimeout(() => {
      if (!isAuthenticated && !token) {
        router.push('/login');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated) {
    return (
      <div className={styles.loading}>
        <Skeleton variant="rect" height={200} borderRadius="var(--radius-md)" />
        <Skeleton variant="text" height={24} />
        <Skeleton variant="text" height={24} />
      </div>
    );
  }

  return <>{children}</>;
}

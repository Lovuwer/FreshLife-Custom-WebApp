'use client';

import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/lib/stores/uiStore';
import { Toast } from './Toast';
import styles from './Toast.module.css';

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            onDismiss={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

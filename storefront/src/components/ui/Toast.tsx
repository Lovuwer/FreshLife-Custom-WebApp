'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './Toast.module.css';

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 3000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <motion.div
      className={`${styles.toast} ${styles[type]}`}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.25 }}
      layout
    >
      <span className={styles.message}>{message}</span>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </motion.div>
  );
}

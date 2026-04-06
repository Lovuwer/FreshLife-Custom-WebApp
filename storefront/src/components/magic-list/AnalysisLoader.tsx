'use client';
import { motion } from 'framer-motion';
import styles from './AnalysisLoader.module.css';

interface AnalysisLoaderProps {
  isVisible: boolean;
}

export function AnalysisLoader({ isVisible }: AnalysisLoaderProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      className={styles.loader}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className={styles.spinner}>
        <div className={styles.ring} />
        <span className={styles.sparkle}>✨</span>
      </div>
      <p className={styles.title}>Analyzing your list...</p>
      <p className={styles.subtitle}>AI is matching items to our inventory</p>
      <div className={styles.steps}>
        <motion.div
          className={styles.step}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0 }}
        >
          📝 Extracting items
        </motion.div>
        <motion.div
          className={styles.step}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          🔍 Searching catalog
        </motion.div>
        <motion.div
          className={styles.step}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          🎯 Finding best matches
        </motion.div>
      </div>
    </motion.div>
  );
}

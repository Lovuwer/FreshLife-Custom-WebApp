'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import styles from './PullToRefresh.module.css';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const THRESHOLD = 60;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      // Check wrapper scroll first; fall back to page scroll for non-scrollable wrappers
      const el = wrapperRef.current;
      const scrollTop = el
        ? el.scrollTop
        : (document.documentElement.scrollTop || document.body.scrollTop);
      if (scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        // Dampen the pull distance
        setPullDistance(Math.min(diff * 0.4, THRESHOLD * 1.6));
      }
    },
    [refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullDistance > 0 || refreshing) && (
        <div
          className={styles.indicator}
          style={{ height: pullDistance || THRESHOLD * 0.6 }}
        >
          {refreshing ? (
            <div className={styles.spinner} />
          ) : (
            <div
              className={`${styles.arrow} ${pullDistance >= THRESHOLD ? styles.arrowReady : ''}`}
            >
              ↓
            </div>
          )}
        </div>
      )}

      <div
        style={{
          transform:
            pullDistance > 0 || refreshing
              ? `translateY(${pullDistance || THRESHOLD * 0.6}px)`
              : undefined,
          transition: pulling.current ? 'none' : 'transform 0.25s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

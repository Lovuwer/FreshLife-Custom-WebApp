'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Banner } from '@/lib/types/product';
import styles from './BannerCarousel.module.css';

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = () => {
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 5000);
  };

  useEffect(() => {
    if (banners.length > 1) startAutoPlay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length]);

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_type === 'Category') router.push(`/category/${encodeURIComponent(banner.link_value)}`);
    else if (banner.link_type === 'Product') router.push(`/product/${encodeURIComponent(banner.link_value)}`);
    else if (banner.link_type === 'URL') window.open(banner.link_value, '_blank');
  };

  if (!banners.length) return null;

  return (
    <div className={styles.carousel}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={styles.slide}
          onClick={() => handleBannerClick(banners[current])}
        >
          <Image
            src={banners[current].image}
            alt={banners[current].title}
            fill
            className={styles.image}
            priority={current === 0}
          />
        </motion.div>
      </AnimatePresence>
      {banners.length > 1 && (
        <div className={styles.dots}>
          {banners.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => { setCurrent(i); if (intervalRef.current) clearInterval(intervalRef.current); startAutoPlay(); }}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

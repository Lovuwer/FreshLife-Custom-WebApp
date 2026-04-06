'use client';
import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import type { ProductImage } from '@/lib/types/product';
import styles from './ProductGallery.module.css';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);

  if (!images.length) {
    return (
      <div className={styles.placeholder}>
        <span>🛒</span>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={styles.mainImageWrap}
          >
            <Image
              src={images[current].image_url}
              alt={images[current].alt_text || productName}
              fill
              className={styles.mainImage}
              priority
              sizes="(max-width: 480px) 100vw, 480px"
            />
          </motion.div>
        </AnimatePresence>
        {images.length > 1 && (
          <div className={styles.dots}>
            {images.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`View image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((img, i) => (
            <button
              key={i}
              className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`}
              onClick={() => setCurrent(i)}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text || `Image ${i + 1}`}
                fill
                className={styles.thumbImage}
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

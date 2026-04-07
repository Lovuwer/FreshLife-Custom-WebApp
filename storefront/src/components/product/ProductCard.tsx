'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/types/product';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { FreshnessPulse } from '@/components/home/FreshnessPulse';
import { useCartStore } from '@/lib/stores/cartStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const qty = useCartStore((s) => s.getItemQuantity(product.item_code));

  const cartItem = {
    item_code: product.item_code,
    item_name: product.item_name,
    quantity: 1,
    rate: product.standard_rate,
    image: product.image,
    max_qty: 20,
    in_stock: product.in_stock,
  };

  const handleIncrement = () => {
    if (qty === 0) addItem(cartItem);
    else updateQuantity(product.item_code, qty + 1);
  };

  const handleDecrement = () => {
    if (qty <= 1) removeItem(product.item_code);
    else updateQuantity(product.item_code, qty - 1);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link href={`/product/${encodeURIComponent(product.item_code)}`} className={styles.card}>
        <div className={styles.imageWrap}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.item_name}
              fill
              className={styles.image}
              sizes="(max-width: 480px) 50vw, 160px"
            />
          ) : (
            <div className={styles.imagePlaceholder}>🛒</div>
          )}
          {!product.in_stock && (
            <div className={styles.outOfStock}>Out of Stock</div>
          )}
          {product.freshness_category !== 'None' && (
            <div className={styles.freshness}>
              <FreshnessPulse category={product.freshness_category} />
            </div>
          )}
        </div>
        <div className={styles.body}>
          <p className={styles.name}>{product.item_name}</p>
          {product.brand_name && <p className={styles.brand}>{product.brand_name}</p>}
          <p className={styles.unit}>{product.unit_label}</p>
          <div className={styles.footer}>
            <span className={styles.price}>{formatCurrency(product.standard_rate)}</span>
            <div onClick={(e) => e.preventDefault()}>
              <QuantitySelector
                quantity={qty}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                max={20}
                compact
                disabled={!product.in_stock}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

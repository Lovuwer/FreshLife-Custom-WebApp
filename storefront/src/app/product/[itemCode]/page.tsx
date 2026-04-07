'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProductDetail } from '@/lib/hooks/useProducts';
import { useCartStore } from '@/lib/stores/cartStore';
import { useLocationStore } from '@/lib/stores/locationStore';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PriceBlock } from '@/components/product/PriceBlock';
import { VariantSelector } from '@/components/product/VariantSelector';
import { NutritionInfo } from '@/components/product/NutritionInfo';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function ProductDetailPage() {
  const params = useParams<{ itemCode: string }>();
  const itemCode = decodeURIComponent(params.itemCode);
  const { currentLocation } = useLocationStore();

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const currentCode = selectedVariant || itemCode;

  const { data: product, isLoading } = useProductDetail(currentCode, currentLocation?.warehouse ?? undefined);

  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const qty = useCartStore((s) => s.getItemQuantity(currentCode));

  const handleIncrement = () => {
    if (!product) return;
    if (qty === 0) {
      addItem({
        item_code: product.item_code,
        item_name: product.item_name,
        quantity: 1,
        rate: product.standard_rate,
        image: product.image,
        max_qty: 20,
        in_stock: product.in_stock,
      });
    } else {
      updateQuantity(product.item_code, qty + 1);
    }
  };

  const handleDecrement = () => {
    if (!product) return;
    if (qty <= 1) removeItem(product.item_code);
    else updateQuantity(product.item_code, qty - 1);
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton variant="text" width={60} height={16} />
        <Skeleton variant="rect" height={320} borderRadius="var(--radius-lg)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <Skeleton variant="text" width="70%" height={28} />
          <Skeleton variant="text" width="40%" height={16} />
          <Skeleton variant="text" width="30%" height={14} />
        </div>
        <Skeleton variant="rect" height={36} borderRadius="var(--radius-md)" />
        <Skeleton variant="rect" height={48} borderRadius="var(--radius-full)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <Skeleton variant="text" width="50%" height={20} />
          <Skeleton variant="text" width="100%" height={14} />
          <Skeleton variant="text" width="90%" height={14} />
          <Skeleton variant="text" width="80%" height={14} />
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className={styles.page}>
      <Link href="javascript:history.back()" className={styles.back}>← Back</Link>

      <ProductGallery images={product.images} productName={product.item_name} />

      <div className={styles.info}>
        <div>
          <h1 className={styles.name}>{product.item_name}</h1>
          {product.brand_name && <p className={styles.brand}>{product.brand_name}</p>}
          <p className={styles.unit}>{product.unit_label}</p>
        </div>

        <PriceBlock rate={product.standard_rate} />

        {product.variants && product.variants.length > 0 && (
          <VariantSelector
            variants={product.variants}
            selectedCode={currentCode}
            onSelect={setSelectedVariant}
          />
        )}

        <div className={styles.addToCart}>
          {qty === 0 ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleIncrement}
              disabled={!product.in_stock}
            >
              {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          ) : (
            <div className={styles.qtyWrapper}>
              <QuantitySelector
                quantity={qty}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                max={20}
              />
            </div>
          )}
        </div>

        {product.description && (
          <div className={styles.description}>
            <h3 className={styles.sectionTitle}>📋 Description</h3>
            <p className={styles.descText}>{product.description}</p>
          </div>
        )}

        {product.nutritional_info && (
          <NutritionInfo info={product.nutritional_info} />
        )}

        {product.related_items && product.related_items.length > 0 && (
          <RelatedProducts products={product.related_items} />
        )}
      </div>
    </div>
  );
}

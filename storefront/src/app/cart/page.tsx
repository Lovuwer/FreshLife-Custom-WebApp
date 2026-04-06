'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { BillBreakdown } from '@/components/cart/BillBreakdown';
import { CouponInput } from '@/components/cart/CouponInput';
import { DeliverySlotPicker } from '@/components/cart/DeliverySlotPicker';
import { StorePickupToggle } from '@/components/cart/StorePickupToggle';
import { DeliveryAddress } from '@/components/cart/DeliveryAddress';
import { PlaceOrderButton } from '@/components/cart/PlaceOrderButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/hooks/useCart';
import { useDeliverySlots, useStorePickup } from '@/lib/hooks/useDelivery';
import { useLocationStore } from '@/lib/stores/locationStore';
import styles from './page.module.css';

export default function CartPage() {
  const { items, clearCart, grandTotal, subtotal } = useCart();
  const { currentLocation } = useLocationStore();
  const warehouse = currentLocation?.warehouse ?? null;

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isPickup, setIsPickup] = useState(false);

  const { data: slotsData, isLoading: slotsLoading } = useDeliverySlots(warehouse);
  const { data: pickupInfo } = useStorePickup(warehouse);

  const minOrderValue = 500;
  const minOrderMet = subtotal >= minOrderValue;

  return (
    <AuthGuard>
      <div className={styles.page}>
        <div className={styles.header}>
          <Link href="/" className={styles.back}>← Continue Shopping</Link>
          <h1 className={styles.title}>My Cart</h1>
          {items.length > 0 && (
            <button className={styles.clearBtn} onClick={clearCart}>Clear All</button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>🛒</span>}
            title="Your cart is empty"
            description="Add items to get started"
            action={<Link href="/"><Button variant="primary">Start Shopping</Button></Link>}
          />
        ) : (
          <>
            <div className={styles.items}>
              {items.map((item) => <CartItemRow key={item.item_code} item={item} />)}
            </div>

            <CouponInput />

            <StorePickupToggle
              isPickup={isPickup}
              onToggle={setIsPickup}
              pickupInfo={pickupInfo ?? null}
            />

            {!isPickup && (
              <DeliverySlotPicker
                data={slotsData ?? null}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
                isLoading={slotsLoading}
              />
            )}

            <DeliveryAddress address={null} onChange={() => {}} />

            <BillBreakdown
              bill={null}
              isLoading={false}
            />

            <PlaceOrderButton
              total={grandTotal}
              minOrderMet={minOrderMet}
              minOrderValue={minOrderValue}
              subtotal={subtotal}
              onClick={() => {}}
            />
          </>
        )}
      </div>
    </AuthGuard>
  );
}

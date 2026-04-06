'use client';
import { useState, useEffect, useCallback } from 'react';
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
import { useCheckout } from '@/lib/hooks/useCheckout';
import { useDeliverySlots, useStorePickup } from '@/lib/hooks/useDelivery';
import { useAddresses } from '@/lib/hooks/useAddresses';
import { useLocationStore } from '@/lib/stores/locationStore';
import styles from './page.module.css';

export default function CartPage() {
  const { items, clearCart, grandTotal, subtotal, couponCode, getBillSummary, bill, isBillLoading } = useCart();
  const { startCheckout, isProcessing, error: checkoutError } = useCheckout();
  const { currentLocation } = useLocationStore();
  const warehouse = currentLocation?.warehouse ?? null;
  const { data: addresses } = useAddresses();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isPickup, setIsPickup] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const { data: slotsData, isLoading: slotsLoading } = useDeliverySlots(warehouse);
  const { data: pickupInfo } = useStorePickup(warehouse);

  const minOrderValue = 500;
  const minOrderMet = subtotal >= minOrderValue;

  // Auto-select primary address
  useEffect(() => {
    if (addresses && !selectedAddress) {
      const primary = addresses.find((a) => a.is_primary_address);
      if (primary) setSelectedAddress(primary.name);
      else if (addresses.length > 0) setSelectedAddress(addresses[0].name);
    }
  }, [addresses, selectedAddress]);

  // Recalculate bill when cart changes
  useEffect(() => {
    if (items.length > 0) {
      getBillSummary({
        cart_items: items.map((i) => ({ item_code: i.item_code, quantity: i.quantity })),
        coupon_code: couponCode || undefined,
        delivery_slot: selectedSlot || undefined,
        is_store_pickup: isPickup,
        address: selectedAddress || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, couponCode, selectedSlot, isPickup, selectedAddress]);

  const handlePlaceOrder = useCallback(() => {
    startCheckout({
      cart_items: items.map((i) => ({ item_code: i.item_code, quantity: i.quantity })),
      delivery_slot: selectedSlot || undefined,
      is_store_pickup: isPickup,
      address: selectedAddress || undefined,
      coupon_code: couponCode || undefined,
    });
  }, [startCheckout, items, selectedSlot, isPickup, selectedAddress, couponCode]);

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

            <DeliveryAddress
              address={addresses?.find((a) => a.name === selectedAddress) || null}
              onChange={() => {}}
            />

            <BillBreakdown
              bill={bill ?? null}
              isLoading={isBillLoading}
            />

            {checkoutError && (
              <p className={styles.error}>⚠️ {checkoutError}</p>
            )}

            <PlaceOrderButton
              total={bill?.grand_total ?? grandTotal}
              minOrderMet={minOrderMet}
              minOrderValue={minOrderValue}
              subtotal={subtotal}
              onClick={handlePlaceOrder}
              isLoading={isProcessing}
            />
          </>
        )}
      </div>
    </AuthGuard>
  );
}

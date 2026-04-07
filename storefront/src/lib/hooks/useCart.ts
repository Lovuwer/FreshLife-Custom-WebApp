'use client';
import { useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '@/lib/stores/cartStore';
import { syncCart, applyCoupon as apiApplyCoupon, getBillSummary } from '@/lib/api/cart';
import type { CartItem } from '@/lib/types/cart';

export function useCart() {
  const store = useCartStore();
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncMutation = useMutation({
    mutationFn: (items: { item_code: string; quantity: number }[]) => syncCart(items),
    onSuccess: (data) => {
      data.items.forEach((item: CartItem) => {
        const current = store.getItemQuantity(item.item_code);
        if (current > 0 && !item.in_stock) {
          store.removeItem(item.item_code);
        }
      });
    },
  });

  const couponMutation = useMutation({
    mutationFn: ({ code, items }: { code: string; items: { item_code: string; quantity: number }[] }) =>
      apiApplyCoupon(code, items),
    onSuccess: (data) => {
      if (data.valid) {
        store.applyCoupon(data.pricing_rule || '', data.discount_amount);
      }
    },
  });

  const billMutation = useMutation({
    mutationFn: getBillSummary,
  });

  const debouncedSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const items = store.items.map((i) => ({ item_code: i.item_code, quantity: i.quantity }));
      if (items.length > 0) syncMutation.mutate(items);
    }, 1000);
  }, [store, syncMutation]);

  const handleApplyCoupon = useCallback(
    (code: string) => {
      const items = store.items.map((i) => ({ item_code: i.item_code, quantity: i.quantity }));
      couponMutation.mutate({ code, items });
    },
    [store, couponMutation]
  );

  return {
    items: store.items,
    couponCode: store.couponCode,
    couponDiscount: store.couponDiscount,
    deliveryFee: store.deliveryFee,
    itemCount: store.getItemCount(),
    subtotal: store.getSubtotal(),
    grandTotal: store.getGrandTotal(),
    addItem: (item: CartItem) => { store.addItem(item); debouncedSync(); },
    removeItem: (code: string) => { store.removeItem(code); debouncedSync(); },
    updateQuantity: (code: string, qty: number) => { store.updateQuantity(code, qty); debouncedSync(); },
    clearCart: store.clearCart,
    applyCoupon: handleApplyCoupon,
    removeCoupon: store.removeCoupon,
    getItemQuantity: store.getItemQuantity,
    syncWithServer: debouncedSync,
    getBillSummary: billMutation.mutateAsync,
    bill: billMutation.data,
    isBillLoading: billMutation.isPending,
    isSyncing: syncMutation.isPending,
    couponError: couponMutation.isError ? (couponMutation.error as Error).message : null,
    couponResult: couponMutation.data,
  };
}

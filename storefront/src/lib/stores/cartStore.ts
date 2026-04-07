import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '@/lib/types/cart';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  deliveryFee: number;
  lastSynced: number | null;

  addItem: (item: CartItem) => void;
  removeItem: (itemCode: string) => void;
  updateQuantity: (itemCode: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getGrandTotal: () => number;
  getItemQuantity: (itemCode: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      deliveryFee: 0,
      lastSynced: null,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.item_code === item.item_code
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.item_code === item.item_code
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.max_qty) }
                  : i
              ),
              lastSynced: Date.now(),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
            lastSynced: Date.now(),
          };
        }),

      removeItem: (itemCode) =>
        set((state) => ({
          items: state.items.filter((i) => i.item_code !== itemCode),
          lastSynced: Date.now(),
        })),

      updateQuantity: (itemCode, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.item_code !== itemCode),
              lastSynced: Date.now(),
            };
          }
          return {
            items: state.items.map((i) =>
              i.item_code === itemCode
                ? { ...i, quantity: Math.min(quantity, i.max_qty) }
                : i
            ),
            lastSynced: Date.now(),
          };
        }),

      clearCart: () =>
        set({
          items: [],
          couponCode: null,
          couponDiscount: 0,
          lastSynced: Date.now(),
        }),

      applyCoupon: (code, discount) =>
        set({ couponCode: code, couponDiscount: discount }),

      removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.rate * item.quantity,
          0
        ),

      getGrandTotal: () => {
        const state = get();
        const subtotal = state.items.reduce(
          (sum, item) => sum + item.rate * item.quantity,
          0
        );
        return subtotal + state.deliveryFee - state.couponDiscount;
      },

      getItemQuantity: (itemCode) =>
        get().items.find((i) => i.item_code === itemCode)?.quantity ?? 0,
    }),
    {
      name: 'freshlife-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
      }),
    }
  )
);

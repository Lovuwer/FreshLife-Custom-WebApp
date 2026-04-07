'use client';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { createPaymentOrder, verifyPayment } from '@/lib/api/payments';
import type { CreateOrderResponse } from '@/lib/api/payments';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { contact: string; email?: string };
  theme: { color: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useCheckout() {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const customer = useAuthStore((s) => s.customer);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(
    async (params: {
      cart_items: { item_code: string; quantity: number }[];
      delivery_slot?: string;
      is_store_pickup?: boolean;
      address?: string;
      coupon_code?: string;
      delivery_instructions?: string;
    }) => {
      setIsProcessing(true);
      setError(null);

      try {
        // 1. Load Razorpay SDK
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error('Failed to load payment gateway');

        // 2. Create order on server (ERPNext Sales Order + Razorpay Order)
        const order: CreateOrderResponse = await createPaymentOrder(params);

        // 3. Open Razorpay checkout modal
        const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKeyId) throw new Error('Payment not configured');

        return new Promise<void>((resolve, reject) => {
          const options: RazorpayOptions = {
            key: razorpayKeyId,
            amount: order.amount,
            currency: order.currency,
            order_id: order.razorpay_order_id,
            name: 'FreshLife',
            description: 'Grocery Order',
            prefill: {
              contact: customer?.phone || '',
              email: customer?.email || undefined,
            },
            theme: { color: '#006a2d' },
            handler: async (response) => {
              try {
                // 4. Verify payment signature on server
                await verifyPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  sales_order: order.sales_order,
                });

                // 5. Success — clear cart and navigate to confirmation
                clearCart();
                router.push(`/checkout/confirmation?order=${order.sales_order}`);
                resolve();
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Payment verification failed';
                setError(message);
                reject(err);
              }
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
                reject(new Error('Payment cancelled'));
              },
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Checkout failed';
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [router, clearCart, customer]
  );

  return { startCheckout, isProcessing, error };
}

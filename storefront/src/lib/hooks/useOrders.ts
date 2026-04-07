'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderHistory, reorderItems } from '@/lib/api/orders';
import { useCartStore } from '@/lib/stores/cartStore';

export function useOrders(page = 0) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () => getOrderHistory(page),
    staleTime: 60 * 1000,
  });
}

export function useReorder() {
  const addItem = useCartStore((s) => s.addItem);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (salesOrder: string) => reorderItems(salesOrder),
    onSuccess: (data) => {
      data.items.forEach((item) => {
        addItem({
          item_code: item.item_code,
          item_name: item.item_name,
          quantity: item.quantity,
          rate: item.rate,
          image: null,
          max_qty: 20,
          in_stock: true,
        });
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

'use client';
import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { analyzeText, analyzeImage } from '@/lib/api/magicList';
import { useCartStore } from '@/lib/stores/cartStore';
import type { MagicListResult, MagicListItem } from '@/lib/types/magicList';

export function useMagicList() {
  const addItem = useCartStore((s) => s.addItem);
  const [result, setResult] = useState<MagicListResult | null>(null);

  const textMutation = useMutation({
    mutationFn: analyzeText,
    onSuccess: (data) => setResult(data),
  });

  const imageMutation = useMutation({
    mutationFn: analyzeImage,
    onSuccess: (data) => setResult(data),
  });

  const addAllMatched = useCallback(() => {
    if (!result) return;
    result.extracted_items
      .filter((item): item is MagicListItem & { matched_item: NonNullable<MagicListItem['matched_item']> } =>
        item.match_status === 'Matched' && item.matched_item !== null && item.matched_item.in_stock
      )
      .forEach((item) => {
        addItem({
          item_code: item.matched_item.item_code,
          item_name: item.matched_item.item_name,
          quantity: parseInt(item.quantity || '1', 10) || 1,
          rate: item.matched_item.rate,
          image: item.matched_item.image,
          max_qty: 20,
          in_stock: true,
        });
      });
  }, [result, addItem]);

  const addSingleItem = useCallback(
    (item: MagicListItem) => {
      if (!item.matched_item || !item.matched_item.in_stock) return;
      addItem({
        item_code: item.matched_item.item_code,
        item_name: item.matched_item.item_name,
        quantity: parseInt(item.quantity || '1', 10) || 1,
        rate: item.matched_item.rate,
        image: item.matched_item.image,
        max_qty: 20,
        in_stock: true,
      });
    },
    [addItem]
  );

  const reset = useCallback(() => setResult(null), []);

  return {
    result,
    analyzeText: textMutation.mutate,
    analyzeImage: imageMutation.mutate,
    addAllMatched,
    addSingleItem,
    reset,
    isAnalyzing: textMutation.isPending || imageMutation.isPending,
    error: textMutation.error?.message || imageMutation.error?.message || null,
  };
}

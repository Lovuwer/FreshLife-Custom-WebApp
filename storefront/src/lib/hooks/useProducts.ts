'use client';
import { useQuery } from '@tanstack/react-query';
import {
  getHomepageData,
  getCategoryItems,
  getProductDetail,
  searchProducts,
} from '@/lib/api/products';

export function useHomepageData(warehouse?: string) {
  return useQuery({
    queryKey: ['homepage', warehouse],
    queryFn: () => getHomepageData(warehouse),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryItems(
  itemGroup: string,
  options?: { warehouse?: string; page?: number; pageSize?: number; sortBy?: string }
) {
  return useQuery({
    queryKey: ['category', itemGroup, options],
    queryFn: () => getCategoryItems(itemGroup, options),
    enabled: !!itemGroup,
    staleTime: 3 * 60 * 1000,
  });
}

export function useProductDetail(itemCode: string, warehouse?: string) {
  return useQuery({
    queryKey: ['product', itemCode, warehouse],
    queryFn: () => getProductDetail(itemCode, warehouse),
    enabled: !!itemCode,
    staleTime: 3 * 60 * 1000,
  });
}

export function useSearchProducts(query: string, warehouse?: string) {
  return useQuery({
    queryKey: ['search', query, warehouse],
    queryFn: () => searchProducts(query, { warehouse, limit: 10 }),
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}

import type { HomepageData, Product, ProductDetail } from '@/lib/types/product';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getHomepageData(warehouse?: string): Promise<HomepageData> {
  const params = new URLSearchParams();
  if (warehouse) params.set('warehouse', warehouse);
  const res = await fetch(`/api/products/homepage?${params}`);
  return handleResponse<HomepageData>(res);
}

export async function getCategoryItems(
  itemGroup: string,
  options?: { warehouse?: string; page?: number; pageSize?: number; sortBy?: string }
): Promise<{ items: Product[]; total: number; has_more: boolean }> {
  const params = new URLSearchParams({ item_group: itemGroup });
  if (options?.warehouse) params.set('warehouse', options.warehouse);
  if (options?.page !== undefined) params.set('page', String(options.page));
  if (options?.pageSize) params.set('page_size', String(options.pageSize));
  if (options?.sortBy) params.set('sort_by', options.sortBy);
  const res = await fetch(`/api/products/category?${params}`);
  return handleResponse<{ items: Product[]; total: number; has_more: boolean }>(res);
}

export async function getProductDetail(itemCode: string, warehouse?: string): Promise<ProductDetail> {
  const params = new URLSearchParams();
  if (warehouse) params.set('warehouse', warehouse);
  const res = await fetch(`/api/products/${encodeURIComponent(itemCode)}?${params}`);
  return handleResponse<ProductDetail>(res);
}

export async function searchProducts(
  query: string,
  options?: { warehouse?: string; limit?: number }
): Promise<{ results: Product[] }> {
  const params = new URLSearchParams({ q: query });
  if (options?.warehouse) params.set('warehouse', options.warehouse);
  if (options?.limit) params.set('limit', String(options.limit));
  const res = await fetch(`/api/products/search?${params}`);
  return handleResponse<{ results: Product[] }>(res);
}

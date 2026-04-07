'use client';
import { useQuery } from '@tanstack/react-query';
import { getRefunds } from '@/lib/api/account';

export function useRefunds() {
  return useQuery({
    queryKey: ['refunds'],
    queryFn: getRefunds,
    staleTime: 60 * 1000,
  });
}

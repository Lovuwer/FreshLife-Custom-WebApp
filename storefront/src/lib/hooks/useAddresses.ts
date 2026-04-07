'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '@/lib/api/account';
import type { Address } from '@/lib/types/account';

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (address: Omit<Address, 'name'>) => addAddress(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...rest }: Partial<Address> & { name: string }) =>
      updateAddress(name, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteAddress(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}
